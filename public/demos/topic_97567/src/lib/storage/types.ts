// Storage layer type definitions
// These interfaces define the contract for the persistence layer.

export interface StorageTransaction {
  commit(): void;
  rollback(): void;
}

export interface TransactionContext<T> {
  data: T;
  commit(): void;
  rollback(): void;
}

export interface JsonStorage<T = unknown> {
  read<U = T>(): U;
  write<U = T>(data: U): void;
  withTransaction<U>(fn: (ctx: TransactionContext<T>) => U): U;
  _resetCache(): void;
}

export interface StorageOptions {
  lockTimeout: number;
  retryInterval: number;
  staleTtl?: number;
}

export interface LockHandle {
  release(): void;
}

export interface LockOptions {
  timeout: number;
  retryInterval: number;
  staleTtl?: number;
}

export type WALEntry = {
  op: 'replace';
  data: unknown;
  timestamp: string;
};
