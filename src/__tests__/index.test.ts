import { describe, expect, test } from "bun:test";
import { parseClientToken, encodeClientHeader, decodeClientHeader } from "../headers/client";
import { encodeServerHeader, decodeServerHeader } from "../headers/server";
import { setLogLevel } from "../logger";
import * as module from "../index";
import { Site } from "../site";

describe("module", () => {
  test("exports expected module elements", () => {
    expect(module.Site).toBe(Site);
    expect(module.setLogLevel).toBe(setLogLevel);

    expect(module.encodeClientHeader).toBe(encodeClientHeader);
    expect(module.decodeClientHeader).toBe(decodeClientHeader);
    expect(module.parseClientToken).toBe(parseClientToken);

    expect(module.encodeServerHeader).toBe(encodeServerHeader);
    expect(module.decodeServerHeader).toBe(decodeServerHeader);
  });
});
