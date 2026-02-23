import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDQBS23AOWYPRKFUXN6K6RUZHT6ACNYRPDYPQXW5CZAIB3UXG3QUSRYI",
  }
} as const


export interface Game {
  player1: string;
  player1_commit_ledger: Option<u32>;
  player1_commitment: Option<Buffer>;
  player1_points: i128;
  player1_x: Option<u32>;
  player1_y: Option<u32>;
  player2: string;
  player2_commit_ledger: Option<u32>;
  player2_commitment: Option<Buffer>;
  player2_points: i128;
  player2_x: Option<u32>;
  player2_y: Option<u32>;
  scene_id: u32;
  winner: Option<string>;
}

export const Errors = {
  1: {message:"GameNotFound"},
  2: {message:"SceneNotFound"},
  3: {message:"SceneInactive"},
  4: {message:"NotPlayer"},
  5: {message:"AlreadyCommitted"},
  6: {message:"NotAllCommitted"},
  7: {message:"AlreadyRevealed"},
  8: {message:"NotAllRevealed"},
  9: {message:"CommitmentMismatch"},
  10: {message:"GameAlreadyEnded"},
  11: {message:"InvalidTargetReveal"}
}


export interface Scene {
  active: boolean;
  target_commitment: Buffer;
  tolerance: u32;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "GameHubAddress", values: void} | {tag: "Scene", values: readonly [u32]} | {tag: "Game", values: readonly [u32]};

export interface Client {
  /**
   * Construct and simulate a reveal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  reveal: ({session_id, player, x, y, salt}: {session_id: u32, player: string, x: u32, y: u32, salt: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_hub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_hub: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_hub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_hub: ({new_hub}: {new_hub: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_game: ({session_id}: {session_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Game>>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_scene transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_scene: ({scene_id}: {scene_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Scene>>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a start_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  start_game: ({session_id, player1, player2, player1_points, player2_points, scene_id}: {session_id: u32, player1: string, player2: string, player1_points: i128, player2_points: i128, scene_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_scene transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_scene: ({scene_id, target_commitment, tolerance}: {scene_id: u32, target_commitment: Buffer, tolerance: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a resolve_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  resolve_game: ({session_id, target_x, target_y, scene_salt}: {session_id: u32, target_x: u32, target_y: u32, scene_salt: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a deactivate_scene transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deactivate_scene: ({scene_id}: {scene_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit_commitment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  submit_commitment: ({session_id, player, commitment}: {session_id: u32, player: string, commitment: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, game_hub}: {admin: string, game_hub: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, game_hub}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABEdhbWUAAAAOAAAAAAAAAAdwbGF5ZXIxAAAAABMAAAAAAAAAFXBsYXllcjFfY29tbWl0X2xlZGdlcgAAAAAAA+gAAAAEAAAAAAAAABJwbGF5ZXIxX2NvbW1pdG1lbnQAAAAAA+gAAAPuAAAAIAAAAAAAAAAOcGxheWVyMV9wb2ludHMAAAAAAAsAAAAAAAAACXBsYXllcjFfeAAAAAAAA+gAAAAEAAAAAAAAAAlwbGF5ZXIxX3kAAAAAAAPoAAAABAAAAAAAAAAHcGxheWVyMgAAAAATAAAAAAAAABVwbGF5ZXIyX2NvbW1pdF9sZWRnZXIAAAAAAAPoAAAABAAAAAAAAAAScGxheWVyMl9jb21taXRtZW50AAAAAAPoAAAD7gAAACAAAAAAAAAADnBsYXllcjJfcG9pbnRzAAAAAAALAAAAAAAAAAlwbGF5ZXIyX3gAAAAAAAPoAAAABAAAAAAAAAAJcGxheWVyMl95AAAAAAAD6AAAAAQAAAAAAAAACHNjZW5lX2lkAAAABAAAAAAAAAAGd2lubmVyAAAAAAPoAAAAEw==",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAACwAAAAAAAAAMR2FtZU5vdEZvdW5kAAAAAQAAAAAAAAANU2NlbmVOb3RGb3VuZAAAAAAAAAIAAAAAAAAADVNjZW5lSW5hY3RpdmUAAAAAAAADAAAAAAAAAAlOb3RQbGF5ZXIAAAAAAAAEAAAAAAAAABBBbHJlYWR5Q29tbWl0dGVkAAAABQAAAAAAAAAPTm90QWxsQ29tbWl0dGVkAAAAAAYAAAAAAAAAD0FscmVhZHlSZXZlYWxlZAAAAAAHAAAAAAAAAA5Ob3RBbGxSZXZlYWxlZAAAAAAACAAAAAAAAAASQ29tbWl0bWVudE1pc21hdGNoAAAAAAAJAAAAAAAAABBHYW1lQWxyZWFkeUVuZGVkAAAACgAAAAAAAAATSW52YWxpZFRhcmdldFJldmVhbAAAAAAL",
        "AAAAAQAAAAAAAAAAAAAABVNjZW5lAAAAAAAAAwAAAAAAAAAGYWN0aXZlAAAAAAABAAAAAAAAABF0YXJnZXRfY29tbWl0bWVudAAAAAAAA+4AAAAgAAAAAAAAAAl0b2xlcmFuY2UAAAAAAAAE",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAOR2FtZUh1YkFkZHJlc3MAAAAAAAEAAAAAAAAABVNjZW5lAAAAAAAAAQAAAAQAAAABAAAAAAAAAARHYW1lAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAGcmV2ZWFsAAAAAAAFAAAAAAAAAApzZXNzaW9uX2lkAAAAAAAEAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAAAXgAAAAAAAAEAAAAAAAAAAF5AAAAAAAABAAAAAAAAAAEc2FsdAAAA+4AAAAgAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAAHZ2V0X2h1YgAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAHc2V0X2h1YgAAAAABAAAAAAAAAAduZXdfaHViAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAIZ2V0X2dhbWUAAAABAAAAAAAAAApzZXNzaW9uX2lkAAAAAAAEAAAAAQAAA+kAAAfQAAAABEdhbWUAAAAD",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAJZ2V0X3NjZW5lAAAAAAAAAQAAAAAAAAAIc2NlbmVfaWQAAAAEAAAAAQAAA+kAAAfQAAAABVNjZW5lAAAAAAAAAw==",
        "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAKc3RhcnRfZ2FtZQAAAAAABgAAAAAAAAAKc2Vzc2lvbl9pZAAAAAAABAAAAAAAAAAHcGxheWVyMQAAAAATAAAAAAAAAAdwbGF5ZXIyAAAAABMAAAAAAAAADnBsYXllcjFfcG9pbnRzAAAAAAALAAAAAAAAAA5wbGF5ZXIyX3BvaW50cwAAAAAACwAAAAAAAAAIc2NlbmVfaWQAAAAEAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAAAAAAAMY3JlYXRlX3NjZW5lAAAAAwAAAAAAAAAIc2NlbmVfaWQAAAAEAAAAAAAAABF0YXJnZXRfY29tbWl0bWVudAAAAAAAA+4AAAAgAAAAAAAAAAl0b2xlcmFuY2UAAAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAAMcmVzb2x2ZV9nYW1lAAAABAAAAAAAAAAKc2Vzc2lvbl9pZAAAAAAABAAAAAAAAAAIdGFyZ2V0X3gAAAAEAAAAAAAAAAh0YXJnZXRfeQAAAAQAAAAAAAAACnNjZW5lX3NhbHQAAAAAA+4AAAAgAAAAAQAAA+kAAAATAAAAAw==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIZ2FtZV9odWIAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAQZGVhY3RpdmF0ZV9zY2VuZQAAAAEAAAAAAAAACHNjZW5lX2lkAAAABAAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAAAAAAARc3VibWl0X2NvbW1pdG1lbnQAAAAAAAADAAAAAAAAAApzZXNzaW9uX2lkAAAAAAAEAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAACmNvbW1pdG1lbnQAAAAAA+4AAAAgAAAAAQAAA+kAAAACAAAAAw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    reveal: this.txFromJSON<Result<void>>,
        get_hub: this.txFromJSON<string>,
        set_hub: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>,
        get_game: this.txFromJSON<Result<Game>>,
        get_admin: this.txFromJSON<string>,
        get_scene: this.txFromJSON<Result<Scene>>,
        set_admin: this.txFromJSON<null>,
        start_game: this.txFromJSON<Result<void>>,
        create_scene: this.txFromJSON<null>,
        resolve_game: this.txFromJSON<Result<string>>,
        deactivate_scene: this.txFromJSON<Result<void>>,
        submit_commitment: this.txFromJSON<Result<void>>
  }
}