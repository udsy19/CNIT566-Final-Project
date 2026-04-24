// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import { hash, verify } from '@node-rs/argon2';

// argon2id with sensible defaults from the OWASP Password Storage Cheat Sheet.
const ARGON2_OPTS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  try {
    return await verify(digest, plain);
  } catch {
    return false;
  }
}
