import { FEATURE } from "./constants";

let cachedFeatures: Map<keyof typeof FEATURE, FEATURE>;

export function FEATURE_MAP() {
  if (cachedFeatures) return cachedFeatures;

  cachedFeatures = new Map<keyof typeof FEATURE, FEATURE>();
  for (const key of Object.keys(FEATURE)) {
    if (!isNaN(Number(key))) continue;

    const typedKey = key as keyof typeof FEATURE;
    cachedFeatures.set(typedKey, FEATURE[typedKey]);
  }

  return cachedFeatures;
}

export function toBase64(data: Uint8Array) {
  if (typeof data.toBase64 === "function") return data.toBase64() as string;
  if (typeof Buffer !== "undefined") return Buffer.from(data).toString("base64") as string;

  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    return btoa(binary);
  }

  throw new Error("Base64 encoding not supported in this environment");
}

export function fromBase64(input: string) {
  if (typeof Uint8Array.fromBase64 === "function") return Uint8Array.fromBase64(input) as Uint8Array;
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(input, "base64"));

  if (typeof atob === "function") {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error("Base64 decoding not supported in this environment");
}

export function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

export const hasFlag = (bit: number, flags: number) => Boolean(bit & flags);
export const setFlags = (features: FEATURE[] = []) => features.reduce((acc, feature) => acc | feature, 0);
