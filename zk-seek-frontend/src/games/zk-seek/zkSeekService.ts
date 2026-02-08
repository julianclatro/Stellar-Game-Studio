import { Client as ZkSeekClient, type Game, type Scene } from './bindings';
import { NETWORK_PASSPHRASE, RPC_URL, DEFAULT_METHOD_OPTIONS, DEFAULT_AUTH_TTL_MINUTES, MULTI_SIG_AUTH_TTL_MINUTES } from '@/utils/constants';
import { contract, xdr, Address, authorizeEntry } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { signAndSendViaLaunchtube } from '@/utils/transactionHelper';
import { calculateValidUntilLedger } from '@/utils/ledgerUtils';
import { injectSignedAuthEntry } from '@/utils/authEntryUtils';

type ClientOptions = contract.ClientOptions;
type Signer = Pick<contract.ClientOptions, 'signTransaction' | 'signAuthEntry'>;

const STORAGE_PREFIX = 'zk-seek:salt';

export class ZkSeekService {
  private baseClient: ZkSeekClient;
  private contractId: string;

  constructor(contractId: string) {
    this.contractId = contractId;
    this.baseClient = new ZkSeekClient({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
  }

  private createSigningClient(publicKey: string, signer: Signer): ZkSeekClient {
    const options: ClientOptions = {
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey,
      ...signer,
    };
    return new ZkSeekClient(options);
  }

  // ========================================================================
  // Read Operations
  // ========================================================================

  async getGame(sessionId: number): Promise<Game | null> {
    try {
      const tx = await this.baseClient.get_game({ session_id: sessionId });
      const result = await tx.simulate();
      if (result.result.isOk()) {
        return result.result.unwrap();
      } else {
        console.log('[getGame] Game not found for session:', sessionId);
        return null;
      }
    } catch (err) {
      console.log('[getGame] Error querying game:', err);
      return null;
    }
  }

  async getScene(sceneId: number): Promise<Scene | null> {
    try {
      const tx = await this.baseClient.get_scene({ scene_id: sceneId });
      const result = await tx.simulate();
      if (result.result.isOk()) {
        return result.result.unwrap();
      } else {
        console.log('[getScene] Scene not found:', sceneId);
        return null;
      }
    } catch (err) {
      console.log('[getScene] Error querying scene:', err);
      return null;
    }
  }

  // ========================================================================
  // Commitment Hashing (client-side, must match contract)
  // ========================================================================

  /**
   * Compute player commitment: keccak256(x_u32_be || y_u32_be || salt_32bytes || player_address_utf8)
   * Must match contract's compute_commitment exactly.
   */
  static computeCommitment(x: number, y: number, salt: Uint8Array, playerAddress: string): Buffer {
    const data = new Uint8Array(4 + 4 + 32 + new TextEncoder().encode(playerAddress).length);
    const view = new DataView(data.buffer);
    view.setUint32(0, x, false); // big-endian
    view.setUint32(4, y, false);
    data.set(salt, 8);
    data.set(new TextEncoder().encode(playerAddress), 40);
    const hash = keccak_256(data);
    return Buffer.from(hash);
  }

  /**
   * Compute scene target commitment: keccak256(target_x_be || target_y_be || scene_salt)
   */
  static computeTargetCommitment(x: number, y: number, sceneSalt: Uint8Array): Buffer {
    const data = new Uint8Array(4 + 4 + 32);
    const view = new DataView(data.buffer);
    view.setUint32(0, x, false);
    view.setUint32(4, y, false);
    data.set(sceneSalt, 8);
    const hash = keccak_256(data);
    return Buffer.from(hash);
  }

  static generateSalt(): Uint8Array {
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    return salt;
  }

  // ========================================================================
  // Salt Persistence (localStorage)
  // ========================================================================

  static saveSaltAndCoords(sessionId: number, playerAddress: string, salt: Uint8Array, x: number, y: number): void {
    const key = `${STORAGE_PREFIX}:${sessionId}:${playerAddress}`;
    const data = {
      salt: Array.from(salt),
      x,
      y,
    };
    localStorage.setItem(key, JSON.stringify(data));
    console.log('[saveSaltAndCoords] Saved for session', sessionId);
  }

  static loadSaltAndCoords(sessionId: number, playerAddress: string): { salt: Uint8Array; x: number; y: number } | null {
    const key = `${STORAGE_PREFIX}:${sessionId}:${playerAddress}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return {
        salt: new Uint8Array(data.salt),
        x: data.x,
        y: data.y,
      };
    } catch {
      return null;
    }
  }

  static clearSaltAndCoords(sessionId: number, playerAddress: string): void {
    const key = `${STORAGE_PREFIX}:${sessionId}:${playerAddress}`;
    localStorage.removeItem(key);
  }

  // ========================================================================
  // Multi-Sig Game Creation (3-step flow, same as NumberGuess)
  // ========================================================================

  /**
   * STEP 1 (Player 1): Prepare start_game and export signed auth entry.
   * ZK Seek has 6 args: session_id, player1, player2, player1_points, player2_points, scene_id.
   * Auth entry only contains [session_id, points] per the require_auth_for_args pattern.
   */
  async prepareStartGame(
    sessionId: number,
    player1: string,
    player2: string,
    player1Points: bigint,
    player2Points: bigint,
    sceneId: number,
    player1Signer: Signer,
    authTtlMinutes?: number
  ): Promise<string> {
    const buildClient = new ZkSeekClient({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey: player2,
    });

    const tx = await buildClient.start_game({
      session_id: sessionId,
      player1,
      player2,
      player1_points: player1Points,
      player2_points: player2Points,
      scene_id: sceneId,
    }, DEFAULT_METHOD_OPTIONS);

    console.log('[prepareStartGame] Transaction built and simulated');

    if (!tx.simulationData?.result?.auth) {
      throw new Error('No auth entries found in simulation');
    }

    const authEntries = tx.simulationData.result.auth;
    let player1AuthEntry = null;

    for (let i = 0; i < authEntries.length; i++) {
      const entry = authEntries[i];
      try {
        const entryAddress = entry.credentials().address().address();
        const entryAddressString = Address.fromScAddress(entryAddress).toString();
        if (entryAddressString === player1) {
          player1AuthEntry = entry;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!player1AuthEntry) {
      throw new Error(`No auth entry found for Player 1 (${player1})`);
    }

    const validUntilLedgerSeq = await calculateValidUntilLedger(
      RPC_URL,
      authTtlMinutes ?? MULTI_SIG_AUTH_TTL_MINUTES
    );

    if (!player1Signer.signAuthEntry) {
      throw new Error('signAuthEntry function not available');
    }

    const signedAuthEntry = await authorizeEntry(
      player1AuthEntry,
      async (preimage) => {
        if (!player1Signer.signAuthEntry) {
          throw new Error('Wallet does not support auth entry signing');
        }
        const signResult = await player1Signer.signAuthEntry(
          preimage.toXDR('base64'),
          { networkPassphrase: NETWORK_PASSPHRASE, address: player1 }
        );
        if (signResult.error) {
          throw new Error(`Failed to sign auth entry: ${signResult.error.message}`);
        }
        return Buffer.from(signResult.signedAuthEntry, 'base64');
      },
      validUntilLedgerSeq,
      NETWORK_PASSPHRASE,
    );

    return signedAuthEntry.toXDR('base64');
  }

  /**
   * Parse auth entry to extract session_id, player1 address, and player1 points.
   * Note: scene_id is NOT in the auth entry (not part of require_auth_for_args).
   */
  parseAuthEntry(authEntryXdr: string): {
    sessionId: number;
    player1: string;
    player1Points: bigint;
    functionName: string;
  } {
    try {
      const authEntry = xdr.SorobanAuthorizationEntry.fromXDR(authEntryXdr, 'base64');
      const credentials = authEntry.credentials();
      const addressCreds = credentials.address();
      const player1 = Address.fromScAddress(addressCreds.address()).toString();

      const rootInvocation = authEntry.rootInvocation();
      const contractFn = rootInvocation.function().contractFn();
      const functionName = contractFn.functionName().toString();

      if (functionName !== 'start_game') {
        throw new Error(`Unexpected function: ${functionName}. Expected start_game.`);
      }

      const args = contractFn.args();
      if (args.length !== 2) {
        throw new Error(`Expected 2 arguments for start_game auth entry, got ${args.length}`);
      }

      const sessionId = args[0].u32();
      const player1Points = args[1].i128().lo().toBigInt();

      return { sessionId, player1, player1Points, functionName };
    } catch (err: any) {
      throw new Error(`Failed to parse auth entry: ${err.message}`);
    }
  }

  /**
   * STEP 2 (Player 2): Import auth entry and rebuild transaction.
   * scene_id is passed separately since it's not in the auth entry.
   */
  async importAndSignAuthEntry(
    player1SignedAuthEntryXdr: string,
    player2Address: string,
    player2Points: bigint,
    sceneId: number,
    player2Signer: Signer,
    authTtlMinutes?: number
  ): Promise<string> {
    const gameParams = this.parseAuthEntry(player1SignedAuthEntryXdr);

    if (player2Address === gameParams.player1) {
      throw new Error('Cannot play against yourself. Player 2 must be different from Player 1.');
    }

    const buildClient = new ZkSeekClient({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey: player2Address,
    });

    const tx = await buildClient.start_game({
      session_id: gameParams.sessionId,
      player1: gameParams.player1,
      player2: player2Address,
      player1_points: gameParams.player1Points,
      player2_points: player2Points,
      scene_id: sceneId,
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(
      RPC_URL,
      authTtlMinutes ?? MULTI_SIG_AUTH_TTL_MINUTES
    );

    const txWithInjectedAuth = await injectSignedAuthEntry(
      tx,
      player1SignedAuthEntryXdr,
      player2Address,
      player2Signer,
      validUntilLedgerSeq
    );

    const player2Client = this.createSigningClient(player2Address, player2Signer);
    const player2Tx = player2Client.txFromXDR(txWithInjectedAuth.toXDR());

    const needsSigning = await player2Tx.needsNonInvokerSigningBy();
    if (needsSigning.includes(player2Address)) {
      await player2Tx.signAuthEntries({ expiration: validUntilLedgerSeq });
    }

    return player2Tx.toXDR();
  }

  /**
   * STEP 3: Finalize and submit the fully-signed transaction.
   */
  async finalizeStartGame(
    txXdr: string,
    signerAddress: string,
    signer: Signer,
    authTtlMinutes?: number
  ) {
    const client = this.createSigningClient(signerAddress, signer);
    const tx = client.txFromXDR(txXdr);
    await tx.simulate();

    const validUntilLedgerSeq = await calculateValidUntilLedger(
      RPC_URL,
      authTtlMinutes ?? DEFAULT_AUTH_TTL_MINUTES
    );

    const sentTx = await signAndSendViaLaunchtube(
      tx,
      DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
      validUntilLedgerSeq
    );
    return sentTx.result;
  }

  // ========================================================================
  // Game Actions (single-sig)
  // ========================================================================

  async submitCommitment(
    sessionId: number,
    playerAddress: string,
    commitment: Buffer,
    signer: Signer,
  ) {
    const client = this.createSigningClient(playerAddress, signer);
    const tx = await client.submit_commitment({
      session_id: sessionId,
      player: playerAddress,
      commitment,
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    const sentTx = await signAndSendViaLaunchtube(
      tx,
      DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
      validUntilLedgerSeq
    );
    return sentTx.result;
  }

  async reveal(
    sessionId: number,
    playerAddress: string,
    x: number,
    y: number,
    salt: Uint8Array,
    signer: Signer,
  ) {
    const client = this.createSigningClient(playerAddress, signer);
    const tx = await client.reveal({
      session_id: sessionId,
      player: playerAddress,
      x,
      y,
      salt: Buffer.from(salt),
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    const sentTx = await signAndSendViaLaunchtube(
      tx,
      DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
      validUntilLedgerSeq
    );
    return sentTx.result;
  }

  async resolveGame(
    sessionId: number,
    targetX: number,
    targetY: number,
    sceneSalt: Uint8Array,
    adminAddress: string,
    signer: Signer,
  ) {
    const client = this.createSigningClient(adminAddress, signer);
    const tx = await client.resolve_game({
      session_id: sessionId,
      target_x: targetX,
      target_y: targetY,
      scene_salt: Buffer.from(sceneSalt),
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    const sentTx = await signAndSendViaLaunchtube(
      tx,
      DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
      validUntilLedgerSeq
    );
    return sentTx.result;
  }

  async createScene(
    sceneId: number,
    targetCommitment: Buffer,
    tolerance: number,
    adminAddress: string,
    signer: Signer,
  ) {
    const client = this.createSigningClient(adminAddress, signer);
    const tx = await client.create_scene({
      scene_id: sceneId,
      target_commitment: targetCommitment,
      tolerance,
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    const sentTx = await signAndSendViaLaunchtube(
      tx,
      DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
      validUntilLedgerSeq
    );
    return sentTx.result;
  }
}
