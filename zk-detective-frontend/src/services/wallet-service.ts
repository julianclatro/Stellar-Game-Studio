// F09: Dev Wallet Service for ZK Detective
//
// Provides three fixed wallets (admin, player1, player2) from env vars.
// All wallets are available simultaneously — needed because start_game()
// requires both players to sign auth entries in the same transaction.
//
// Pattern from: sgs_frontend/src/services/devWalletService.ts

import { Buffer } from 'buffer';
import { Keypair, TransactionBuilder, hash } from '@stellar/stellar-sdk';

export interface WalletSigner {
  publicKey: string;
  signTransaction: (txXdr: string, opts?: { networkPassphrase?: string }) => Promise<{
    signedTxXdr: string;
    signerAddress: string;
  }>;
  signAuthEntry: (preimageXdr: string) => Promise<{
    signedAuthEntry: string;
    signerAddress: string;
  }>;
  /** Raw ed25519 sign — used by authorizeEntry for Soroban auth */
  sign: (data: Buffer) => Buffer;
}

function createSigner(keypair: Keypair): WalletSigner {
  const publicKey = keypair.publicKey();

  return {
    publicKey,

    signTransaction: async (txXdr, opts) => {
      const networkPassphrase = opts?.networkPassphrase;
      if (!networkPassphrase) throw new Error('Missing networkPassphrase');
      const tx = TransactionBuilder.fromXDR(txXdr, networkPassphrase);
      tx.sign(keypair);
      return { signedTxXdr: tx.toXDR(), signerAddress: publicKey };
    },

    signAuthEntry: async (preimageXdr) => {
      const preimageBytes = Buffer.from(preimageXdr, 'base64');
      const payload = hash(preimageBytes);
      const sig = keypair.sign(payload);
      return {
        signedAuthEntry: Buffer.from(sig).toString('base64'),
        signerAddress: publicKey,
      };
    },

    sign: (data) => keypair.sign(data),
  };
}

function loadWallet(envKey: string, label: string): WalletSigner | null {
  const secret = import.meta.env[envKey] as string | undefined;
  if (!secret) return null;
  try {
    return createSigner(Keypair.fromSecret(secret));
  } catch (e) {
    console.warn(`Failed to load ${label} wallet:`, e);
    return null;
  }
}

export const adminWallet = loadWallet('VITE_DEV_ADMIN_SECRET', 'admin');
export const player1Wallet = loadWallet('VITE_DEV_PLAYER1_SECRET', 'player1');
export const player2Wallet = loadWallet('VITE_DEV_PLAYER2_SECRET', 'player2');

export function isWalletAvailable(): boolean {
  return !!(player1Wallet && player2Wallet);
}
