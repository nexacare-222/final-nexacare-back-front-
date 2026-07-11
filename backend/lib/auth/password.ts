import argon2 from 'argon2';

/**
 * argon2id is used over bcrypt: it's resistant to both GPU-cracking and
 * side-channel attacks, and is the OWASP-recommended default for new systems.
 * Tuning below targets ~30-60ms per hash on typical server hardware — enough
 * to make brute-forcing expensive without hurting login latency.
 */
const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB, OWASP minimum recommendation
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  if (typeof plaintext !== 'string' || plaintext.length < 8) {
    throw new Error('Password must be a string of at least 8 characters');
  }
  return argon2.hash(plaintext, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    // Malformed hash, algorithm mismatch, etc. — never throw into caller,
    // always resolve to a boolean so callers can't accidentally treat an
    // exception as "authenticated".
    return false;
  }
}
