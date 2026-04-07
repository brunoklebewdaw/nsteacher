import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  if (!secretKey) {
    throw new Error('SESSION_SECRET não configurada no arquivo .env');
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  if (!secretKey) {
    throw new Error('SESSION_SECRET não configurada no arquivo .env');
  }
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}
