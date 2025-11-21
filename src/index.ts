import { ServerHeader } from "./headers/server.class";
import { ClientHeader } from "./headers/client.class";
import { ServerHeaderOptions, ZEROAD_NETWORK_PUBLIC_KEY } from "./constants";
export { setLogLevel } from "./logger";

export * from "./constants";
export type * from "./constants";

export { ServerHeader, ClientHeader };

export class Site {
  serverHeader: ServerHeader;
  clientHeader: ClientHeader;

  constructor(options: ServerHeaderOptions) {
    this.serverHeader = new ServerHeader(options);
    this.clientHeader = new ClientHeader(ZEROAD_NETWORK_PUBLIC_KEY);
  }
}

let _defaultSite: Site;

// Helpers for shorter syntax
export const init = (options: ServerHeaderOptions) => (_defaultSite = new Site(options));
export const processRequest = (headerValue: string | undefined) =>
  _defaultSite.clientHeader.processRequest(headerValue);
export const getClientHeaderName = () => _defaultSite.clientHeader.name;
export const getServerHeaderName = () => _defaultSite.serverHeader.name;
export const getServerHeaderValue = () => _defaultSite.serverHeader.value;
