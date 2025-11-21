import { generateKeys } from "../native.crypto";

const { privateKey, publicKey } = generateKeys();

console.info("Public Key:", publicKey);
console.info("Private Key:", privateKey);
