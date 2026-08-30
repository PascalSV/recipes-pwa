import { describe, it, expect } from 'vitest';
import { resolveUserToken, resolveToken } from '../lib/auth.ts';
import type { Env } from '../types.ts';

// Minimal mock Env
function makeEnv(pascal: string, claudia: string): Env {
  return {
    RECIPES_BUCKET: {} as R2Bucket,
    TOKEN_PASCAL: pascal,
    TOKEN_CLAUDIA: claudia,
    ALLOWED_USERS: 'Claudia,Pascal',
    COMMIT_SHA: 'test',
    SW_VERSION: 'test',
  };
}

// ---- resolveUserToken ----

describe('resolveUserToken', () => {
  it('validates correct token for the specified user', () => {
    const env = makeEnv('pascal-secret', 'claudia-secret');
    const session = resolveUserToken(env, 'Pascal', 'pascal-secret');
    expect(session).not.toBeNull();
    expect(session!.user).toBe('Pascal');
    expect(session!.token).toBe('pascal-secret');
  });

  it('returns null for wrong token', () => {
    const env = makeEnv('pascal-secret', 'claudia-secret');
    expect(resolveUserToken(env, 'Pascal', 'wrong-token')).toBeNull();
  });

  it('returns null when token matches a DIFFERENT user', () => {
    const env = makeEnv('changeme', 'changeme');
    // Both users have the same token — should only match the requested user
    const session = resolveUserToken(env, 'Pascal', 'changeme');
    expect(session).not.toBeNull();
    expect(session!.user).toBe('Pascal');
  });

  it('does NOT match Claudia token for Pascal login', () => {
    const env = makeEnv('pascal-tok', 'claudia-tok');
    expect(resolveUserToken(env, 'Pascal', 'claudia-tok')).toBeNull();
  });

  it('does NOT match Pascal token for Claudia login', () => {
    const env = makeEnv('pascal-tok', 'claudia-tok');
    expect(resolveUserToken(env, 'Claudia', 'pascal-tok')).toBeNull();
  });

  it('handles case-insensitive user name lookup via ALLOWED_USERS', () => {
    const env = makeEnv('pascal-tok', 'claudia-tok');
    // resolveUserToken looks up TOKEN_PASCAL from the uppercase name
    const session = resolveUserToken(env, 'Pascal', 'pascal-tok');
    expect(session).not.toBeNull();
  });
});

// ---- resolveToken (cookie/bearer scan) ----

describe('resolveToken', () => {
  it('finds user by token', () => {
    const env = makeEnv('p-tok', 'c-tok');
    const s = resolveToken(env, 'c-tok');
    expect(s?.user).toBe('Claudia');
  });

  it('returns null for unknown token', () => {
    const env = makeEnv('p-tok', 'c-tok');
    expect(resolveToken(env, 'unknown')).toBeNull();
  });

  it('returns first match when tokens are identical (Claudia comes first in ALLOWED_USERS)', () => {
    const env = makeEnv('same', 'same');
    const s = resolveToken(env, 'same');
    expect(s?.user).toBe('Claudia'); // Claudia first in "Claudia,Pascal"
  });
});
