import {
  createPrivateKey,
  createPublicKey,
  sign as nodeSign,
  verify as nodeVerify,
  randomBytes,
  generateKeyPairSync,
} from "crypto";

export { KeyObject } from "crypto";

export const generateKeys = () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");

  const privateBase64 = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
  const publicBase64 = publicKey.export({ format: "der", type: "spki" }).toString("base64");

  return {
    privateKey: privateBase64,
    publicKey: publicBase64,
  };
};

export const importPrivateKey = (privateKeyBase64: string) => {
  const keyBuffer = Buffer.from(privateKeyBase64, "base64");
  return createPrivateKey({
    key: keyBuffer,
    format: "der",
    type: "pkcs8",
  });
};

export const importPublicKey = (publicKeyBase64: string) => {
  const keyBuffer = Buffer.from(publicKeyBase64, "base64");
  return createPublicKey({
    key: keyBuffer,
    format: "der",
    type: "spki",
  });
};

export const sign = (data: ArrayBuffer, privateKey: ReturnType<typeof importPrivateKey>) => {
  const buffer = Buffer.from(data);
  return nodeSign(null, buffer, privateKey);
};

export const verify = (data: ArrayBuffer, signature: ArrayBuffer, publicKey: ReturnType<typeof importPublicKey>) => {
  const dataBuffer = Buffer.from(data);
  const sigBuffer = Buffer.from(signature);
  return nodeVerify(null, dataBuffer, publicKey, sigBuffer);
};

export const nonce = (size: number) => new Uint8Array(randomBytes(size));
