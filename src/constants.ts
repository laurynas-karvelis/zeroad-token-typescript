/**
 * This is an official ZeroAd Network public key.
 * Used to verify `X-Better-Web-User` header values are not tampered with.
 */
export const ZEROAD_NETWORK_PUBLIC_KEY: string = "MCowBQYDK2VwAyEAignXRaTQtxEDl4ThULucKNQKEEO2Lo5bEO8qKwjSDVs=";

export enum SITE_FEATURES {
  ADLESS_EXPERIENCE = 1 << 0,
  PREMIUM_CONTENT_ACCESS = 1 << 1,
  VIP_EXPERIENCE = 1 << 2,
}

export type UUID = string;

export enum SERVER_HEADERS {
  WELCOME = "X-Better-Web-Welcome",
}

export enum CLIENT_HEADERS {
  HELLO = "X-Better-Web-Hello",
}

export enum PROTOCOL_VERSION {
  V_1 = 1,
}

export const CURRENT_PROTOCOL_VERSION = PROTOCOL_VERSION.V_1;

export type ServerHeaderSimpleOptions = {
  value: string;
};

export type ServerHeaderExtendedOptions = {
  siteId: UUID;
  features: SITE_FEATURES[];
};

export type ServerHeaderOptions = ServerHeaderExtendedOptions | ServerHeaderSimpleOptions;

export type WelcomeHeaderParseResult = WelcomeHeader | undefined;
export type WelcomeHeader = {
  version: PROTOCOL_VERSION;
  siteId: UUID;
  flags: number;
};

export type ClientHeaderParseResult = ClientParsedHeader | undefined;
export type ClientParsedHeader = {
  version: PROTOCOL_VERSION;
  expiresAt: Date;
  expired: boolean;
  flags: number;
};
