import { describe, test, expect } from "bun:test";
import { getClientHeaderName, getServerHeaderName, getServerHeaderValue, init, processRequest, Site } from "../index";
import { CLIENT_HEADERS, PROTOCOL_VERSION, SERVER_HEADERS, SITE_FEATURES } from "../constants";

describe("module", () => {
  const validButExpiredClientHeaderValue =
    "Aav2IXRoh0oKBw==.2yZfC2/pM9DWfgX+von4IgWLmN9t67HJHLiee/gx4+pFIHHurwkC3PCHT1Kaz0yUhx3crUaxST+XLlRtJYacAQ==";

  describe("Site class", () => {
    const siteId = "073C3D79-B960-4335-B948-416AC1E3DBD4";
    const features = [SITE_FEATURES.ADLESS_EXPERIENCE, SITE_FEATURES.PREMIUM_CONTENT_ACCESS];

    test("should generate a valid server header", () => {
      const site = new Site({ siteId, features });
      expect(site.serverHeader.name).toEqual(SERVER_HEADERS.WELCOME);
      expect(site.serverHeader.value).toBe("Bzw9eblgQzW5SEFqwePb1A^1^3");
    });

    test("should contain correct client hello header name", () => {
      const site = new Site({ siteId, features: [] });
      expect(site.clientHeader.name).toEqual(CLIENT_HEADERS.HELLO);
    });

    test("should parse client header data correctly with the official public key", () => {
      const site = new Site({ siteId, features: [SITE_FEATURES.ADLESS_EXPERIENCE] });

      const request = site.clientHeader.processRequest(validButExpiredClientHeaderValue);

      // expired token
      expect(request.data).toEqual({
        expiresAt: new Date("2025-07-28T09:59:38.000Z"),
        version: PROTOCOL_VERSION.V_1,
        expired: true,
        flags: 7,
      });

      expect(request.shouldRemoveAds()).toBe(false);
      expect(request.shouldEnablePremiumContentAccess()).toBe(false);
      expect(request.shouldEnableVipExperience()).toBe(false);
    });
  });

  describe("default Site instance helpers", () => {
    const siteId = "94F37AA5-0DA8-462E-9DE9-DCDE26FB470A";
    const features = [
      SITE_FEATURES.ADLESS_EXPERIENCE,
      SITE_FEATURES.PREMIUM_CONTENT_ACCESS,
      SITE_FEATURES.VIP_EXPERIENCE,
    ];

    init({ siteId, features });

    describe("getServerHeaderName()", () => {
      test("should return correct Welcome header name", () => {
        expect(getServerHeaderName()).toEqual(SERVER_HEADERS.WELCOME);
      });
    });

    describe("getServerHeaderValue()", () => {
      test("should return correct Welcome header value", () => {
        expect(getServerHeaderValue()).toEqual("lPN6pQ2oRi6d6dzeJvtHCg^1^7");
      });
    });

    describe("getClientHeaderName()", () => {
      test("should return correct Client Hello header name", () => {
        expect(getClientHeaderName()).toEqual(CLIENT_HEADERS.HELLO);
      });
    });

    describe("processRequest()", () => {
      test("should return correct Client Hello header value", () => {
        const processedValue = processRequest(validButExpiredClientHeaderValue);
        expect(processedValue).toEqual(
          expect.objectContaining({
            data: {
              expiresAt: new Date("2025-07-28T09:59:38.000Z"),
              version: PROTOCOL_VERSION.V_1,
              expired: true,
              flags: 7,
            },
          })
        );

        expect(typeof processedValue.shouldRemoveAds).toBe("function");
        expect(typeof processedValue.shouldEnablePremiumContentAccess).toBe("function");
        expect(typeof processedValue.shouldEnableVipExperience).toBe("function");
      });
    });
  });
});
