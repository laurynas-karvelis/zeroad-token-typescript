import { CLIENT_HEADERS, FEATURES, SERVER_HEADERS, ZEROAD_NETWORK_PUBLIC_KEY } from "./constants";
import { ClientHeaderValue, parseClientToken } from "./headers/client";
import { encodeServerHeader } from "./headers/server";

export type SiteOptions = {
  clientId: string;
  features: FEATURES[];
};

export function Site(options: SiteOptions) {
  const serverHeaderValue = encodeServerHeader(options.clientId, options.features);

  return {
    parseClientToken: (headerValue: ClientHeaderValue) =>
      parseClientToken(headerValue, { clientId: options.clientId, features: options.features }),
    CLIENT_HEADER_NAME: CLIENT_HEADERS.HELLO.toLowerCase(),
    SERVER_HEADER_NAME: SERVER_HEADERS.WELCOME,
    SERVER_HEADER_VALUE: serverHeaderValue,
  };
}
