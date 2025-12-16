import { CLIENT_HEADER, FEATURE, SERVER_HEADER } from "./constants";
import { ClientHeaderValue, parseClientToken } from "./headers/client";
import { encodeServerHeader } from "./headers/server";

export type SiteOptions = {
  clientId: string;
  features: FEATURE[];
};

export function Site(options: SiteOptions) {
  const serverHeaderValue = encodeServerHeader(options.clientId, options.features);

  return {
    parseClientToken: (headerValue: ClientHeaderValue) =>
      parseClientToken(headerValue, { clientId: options.clientId, features: options.features }),
    CLIENT_HEADER_NAME: CLIENT_HEADER.HELLO.toLowerCase(),
    SERVER_HEADER_NAME: SERVER_HEADER.WELCOME,
    SERVER_HEADER_VALUE: serverHeaderValue,
  };
}
