import {
  CURRENT_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  SERVER_HEADERS,
  SITE_FEATURES,
  ServerHeaderOptions,
  UUID,
  WelcomeHeaderParseResult,
} from "../constants";
import { assert, base64ToUuid, setFeatures, uuidToBase64 } from "../helpers";
import { log } from "../logger";

const SEPARATOR = "^";

export class ServerHeader {
  name = SERVER_HEADERS.WELCOME;
  value: string;

  constructor(options: ServerHeaderOptions) {
    if ("value" in options) {
      this.value = options.value;
    } else {
      const { siteId, features } = options;
      this.value = this.encode(siteId, features);
    }
  }

  encode(siteId: UUID, features: SITE_FEATURES[]) {
    const flags = setFeatures(0, features);
    const encodedSiteId = uuidToBase64(siteId);

    return [encodedSiteId, CURRENT_PROTOCOL_VERSION, flags].join(SEPARATOR);
  }

  static decode(headerValue: string | undefined): WelcomeHeaderParseResult {
    if (!headerValue?.length) return;

    try {
      const parts = headerValue.split(SEPARATOR);
      assert(parts.length === 3, "Invalid header value format");

      const [encodedSiteId, protocolVersion, flags] = parts;

      assert(
        Object.values(PROTOCOL_VERSION).includes(Number(protocolVersion)),
        "Invalid or unsupported protocol version"
      );

      const siteId = base64ToUuid(encodedSiteId);
      assert(siteId.length === 36, "Invalid siteId value");

      if (PROTOCOL_VERSION.V_1) {
        assert([1, 2, 3, 4, 5, 6, 7].includes(Number(flags)), "Invalid flags value");
      }

      return {
        version: Number(protocolVersion),
        flags: Number(flags),
        siteId,
      };
    } catch (err) {
      log("warn", "Could not decode server header value", { reason: (err as Error)?.message });
    }
  }
}
