import { EncryptJWT, SignJWT, importPKCS8, jwtDecrypt } from 'jose';

import { JWT_EXPIRES } from './constants';
import hkdf from '@panva/hkdf';
import { v4 as uuid } from 'uuid';

async function getHMACSigningKey(secret: string | Buffer) {
  return await hkdf('sha256', secret, '', '', 32);
}

const now = () => Math.round(Date.now() / 1000);

export async function encodeAuthJWT(data: string, secret: string | Buffer, maxAge: number = JWT_EXPIRES) {
  const encryptionSecret = await getHMACSigningKey(secret);
  return await new EncryptJWT({ d: data })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(now() + maxAge)
    .setJti(uuid())
    .encrypt(encryptionSecret);
}

export async function decodeAuthJWT(jwt: string, secret: string | Buffer): Promise<string | null> {
  if (!jwt) {
    return null;
  }
  const encryptionSecret = await getHMACSigningKey(secret);
  try {
    const { payload } = await jwtDecrypt(jwt, encryptionSecret, {
      clockTolerance: 15,
    });
    return (payload.d as string | undefined) ?? null;
  } catch (e) {
    return null;
  }
}

export async function encodeRS256JWT(data: string, key: string): Promise<string | null> {
  const time = now();
  const expires = time + 90;
  const payload = {
    // Issued at time
    exp: expires,
    iat: time, // JWT expiration time (10 minutes maximum)
    iss: data, // GitHub App's identifier
  };
  const privateKey = await importPKCS8(key, 'ES256');
  return await new SignJWT(payload).setProtectedHeader({ alg: 'RS256' }).setIssuedAt().setExpirationTime(expires).sign(privateKey);
}
