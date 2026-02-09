// F09: Soroban Contract Service for ZK Detective
//
// Wraps interactions with the deployed zk-detective contract.
// Uses @stellar/stellar-sdk Client directly (no generated bindings needed).
//
// Contract methods used:
//   start_game(session_id, player1, player2, p1_points, p2_points, case_id)
//   accuse(session_id, player, suspect_id, weapon_id, room_id, salt)
//   update_progress(session_id, player, clues_inspected, rooms_visited)
//   get_game(session_id) → GameState
//   get_case(case_id) → BytesN<32>

import {
  Contract,
  TransactionBuilder,
  Networks,
  xdr,
  Address,
  nativeToScVal,
  authorizeEntry,
  hash,
  rpc,
} from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import type { WalletSigner } from './wallet-service';
import { player1Wallet, player2Wallet } from './wallet-service';
import { textSaltToBytes32 } from '@/data/commitment';

const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE ?? Networks.TESTNET;
const CONTRACT_ID = import.meta.env.VITE_ZK_DETECTIVE_CONTRACT_ID as string | undefined;

const SUBMIT_TIMEOUT_MS = 30_000;

export interface AccuseResult {
  isCorrect: boolean;
  txHash: string;
}

export interface OnChainGameState {
  sessionId: number;
  caseId: number;
  player1: string;
  player2: string;
  startLedger: number;
  solveLedger: number;
  cluesInspected: number;
  roomsVisited: number;
  wrongAccusations: number;
  status: string;
  winner: string | null;
}

class ContractService {
  private server: rpc.Server | null = null;
  private contractId: string | null = null;

  isAvailable(): boolean {
    return !!CONTRACT_ID && !!player1Wallet && !!player2Wallet;
  }

  private getServer(): rpc.Server {
    if (!this.server) {
      this.server = new rpc.Server(RPC_URL);
    }
    return this.server;
  }

  private getContractId(): string {
    if (!CONTRACT_ID) throw new Error('VITE_ZK_DETECTIVE_CONTRACT_ID not set');
    return CONTRACT_ID;
  }

  /**
   * Build, simulate, sign, and submit a contract invocation.
   */
  private async invoke(
    method: string,
    args: xdr.ScVal[],
    signer: WalletSigner,
    additionalSigners?: WalletSigner[],
  ): Promise<{ resultValue: xdr.ScVal | undefined; txHash: string }> {
    const server = this.getServer();
    const contract = new Contract(this.getContractId());
    const sourceAccount = await server.getAccount(signer.publicKey);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: '10000000',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(60)
      .build();

    // Simulate to get auth entries and resource estimates
    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Sign auth entries BEFORE assembly so assembleTransaction uses signed versions
    const allSigners = [signer, ...(additionalSigners ?? [])];
    const signerMap = new Map(allSigners.map(s => [s.publicKey, s]));

    const simSuccess = simulated as rpc.Api.SimulateTransactionSuccessResponse;
    if (simSuccess.result?.auth) {
      const validUntil = simSuccess.latestLedger + 100;
      const signedAuth: xdr.SorobanAuthorizationEntry[] = [];

      for (let entry of simSuccess.result.auth) {
        const creds = entry.credentials();

        if (creds.switch().name === 'sorobanCredentialsAddress') {
          const addr = Address.fromScAddress(creds.address().address()).toString();
          const matchedSigner = signerMap.get(addr);

          if (matchedSigner) {
            // Use SigningCallback form: receives preimage, returns {signature, publicKey}
            const signerFn = async (preimage: xdr.HashIdPreimage) => {
              const payload = hash(preimage.toXDR());
              const signature = matchedSigner.sign(Buffer.from(payload));
              return { signature, publicKey: matchedSigner.publicKey };
            };
            entry = await authorizeEntry(entry, signerFn, validUntil, NETWORK_PASSPHRASE);
            console.log(`[F09] Signed auth entry for ${addr.slice(0, 8)}...`);
          }
        }

        signedAuth.push(entry);
      }

      simSuccess.result.auth = signedAuth;
    }

    // Assemble with signed auth entries
    const assembled = rpc.assembleTransaction(tx, simSuccess).build();

    // Sign the transaction envelope (source account only — additional signers
    // are authorized via their signed auth entries, not envelope signatures)
    const txXdrString = assembled.toXDR();
    const { signedTxXdr } = await signer.signTransaction(txXdrString, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const finalXdr: string = typeof signedTxXdr === 'string'
      ? signedTxXdr
      : Buffer.from(signedTxXdr).toString('base64');

    // Submit
    const submitTx = TransactionBuilder.fromXDR(finalXdr, NETWORK_PASSPHRASE);
    const sendResponse = await server.sendTransaction(submitTx);

    if (sendResponse.status === 'ERROR') {
      console.error('[F09] sendTransaction error response:', JSON.stringify(sendResponse, null, 2));
      const errorXdr = (sendResponse as any).errorResult?.toXDR?.('base64') ?? 'no XDR';
      const diagnostics = (sendResponse as any).diagnosticEventsXdr ?? [];
      console.error('[F09] Error XDR:', errorXdr);
      console.error('[F09] Diagnostic events:', diagnostics.length);
      throw new Error(`Transaction submission failed: ${sendResponse.status} | ${errorXdr}`);
    }

    // Poll for result
    const txHash = sendResponse.hash;
    const result = await this.pollTransaction(txHash);

    return {
      resultValue: result,
      txHash,
    };
  }

  private async pollTransaction(hash: string): Promise<xdr.ScVal | undefined> {
    const server = this.getServer();
    const deadline = Date.now() + SUBMIT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const response = await server.getTransaction(hash);

      if (response.status === 'SUCCESS') {
        return response.returnValue;
      }
      if (response.status === 'FAILED') {
        throw new Error(`Transaction failed on-chain: ${hash}`);
      }
      // NOT_FOUND — still pending
      await new Promise(r => setTimeout(r, 2000));
    }

    throw new Error(`Transaction timed out: ${hash}`);
  }

  /**
   * Start a new game session on-chain.
   * Both dev wallets sign the transaction (multi-sig).
   */
  async startGame(sessionId: number, caseId: number): Promise<string> {
    if (!player1Wallet || !player2Wallet) {
      throw new Error('Both player wallets required');
    }

    const args = [
      nativeToScVal(sessionId, { type: 'u32' }),
      new Address(player1Wallet.publicKey).toScVal(),
      new Address(player2Wallet.publicKey).toScVal(),
      nativeToScVal(100, { type: 'i128' }),  // player1 points stake
      nativeToScVal(100, { type: 'i128' }),  // player2 points stake
      nativeToScVal(caseId, { type: 'u32' }),
    ];

    const { txHash } = await this.invoke(
      'start_game',
      args,
      player1Wallet,
      [player2Wallet],
    );

    return txHash;
  }

  /**
   * Submit an accusation to the contract.
   * Returns whether the accusation was correct + the transaction hash.
   */
  async accuse(
    sessionId: number,
    suspectId: number,
    weaponId: number,
    roomId: number,
    saltText: string,
  ): Promise<AccuseResult> {
    if (!player1Wallet) throw new Error('Player wallet required');

    const salt32 = textSaltToBytes32(saltText);

    const args = [
      nativeToScVal(sessionId, { type: 'u32' }),
      new Address(player1Wallet.publicKey).toScVal(),
      nativeToScVal(suspectId, { type: 'u32' }),
      nativeToScVal(weaponId, { type: 'u32' }),
      nativeToScVal(roomId, { type: 'u32' }),
      nativeToScVal(Buffer.from(salt32), { type: 'bytes' }),
    ];

    const { resultValue, txHash } = await this.invoke('accuse', args, player1Wallet);

    // Parse bool result
    const isCorrect = resultValue?.switch()?.name === 'scvBool'
      ? resultValue.value() === true
      : false;

    return { isCorrect, txHash };
  }

  /**
   * Update investigation progress on-chain.
   */
  async updateProgress(
    sessionId: number,
    cluesInspected: number,
    roomsVisited: number,
  ): Promise<void> {
    if (!player1Wallet) throw new Error('Player wallet required');

    const args = [
      nativeToScVal(sessionId, { type: 'u32' }),
      new Address(player1Wallet.publicKey).toScVal(),
      nativeToScVal(cluesInspected, { type: 'u32' }),
      nativeToScVal(roomsVisited, { type: 'u32' }),
    ];

    await this.invoke('update_progress', args, player1Wallet);
  }

  /**
   * Query current game state (read-only, no signing needed).
   */
  async getGame(sessionId: number): Promise<OnChainGameState | null> {
    try {
      const server = this.getServer();
      const contract = new Contract(this.getContractId());
      const sourceAccount = await server.getAccount(
        player1Wallet?.publicKey ?? player2Wallet!.publicKey
      );

      const tx = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call('get_game', nativeToScVal(sessionId, { type: 'u32' }))
        )
        .setTimeout(30)
        .build();

      const simulated = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulated)) return null;
      if (!rpc.Api.isSimulationSuccess(simulated)) return null;

      // Parse the struct from simulation result
      const resultVal = simulated.result?.retval;
      if (!resultVal) return null;

      return parseGameState(resultVal);
    } catch {
      return null;
    }
  }
}

/**
 * Parse a GameState struct from an ScVal.
 */
function parseGameState(val: xdr.ScVal): OnChainGameState {
  const fields = val.map() ?? [];
  const get = (name: string) => fields.find(
    (f: any) => f.key().str?.() === name || f.key().sym?.() === name
  )?.val();

  return {
    sessionId: get('session_id')?.u32() ?? 0,
    caseId: get('case_id')?.u32() ?? 0,
    player1: get('player1')?.address()?.toString() ?? '',
    player2: get('player2')?.address()?.toString() ?? '',
    startLedger: get('start_ledger')?.u32() ?? 0,
    solveLedger: get('solve_ledger')?.u32() ?? 0,
    cluesInspected: get('clues_inspected')?.u32() ?? 0,
    roomsVisited: get('rooms_visited')?.u32() ?? 0,
    wrongAccusations: get('wrong_accusations')?.u32() ?? 0,
    status: parseStatus(get('status')),
    winner: null, // Simplified — would need Option<Address> parsing
  };
}

function parseStatus(val: xdr.ScVal | undefined): string {
  if (!val) return 'unknown';
  try {
    const name = val.sym?.()?.toString() ?? val.str?.()?.toString();
    if (name) return name;
    // Enum variant
    const variant = val.vec?.();
    if (variant && variant.length > 0) return variant[0].sym?.()?.toString() ?? 'unknown';
  } catch { /* ignore */ }
  return 'unknown';
}

// Singleton
export const contractService = new ContractService();
