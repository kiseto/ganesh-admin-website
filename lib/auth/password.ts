import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(nodeScrypt);

export async function hashPassword(password: string) {
  if (password.length < 10 || password.length > 256) throw new Error("Use a password between 10 and 256 characters.");
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  if (password.length > 256 || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded)) return false;
  const [, salt, expectedHex] = encoded.split("$");
  const actual = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(expectedHex, "hex"), actual);
}
