import { describe, expect, test } from "bun:test"
import { decodeClientHeader, encodeClientHeader, parseClientToken } from "../headers/client"
import { decodeServerHeader, encodeServerHeader } from "../headers/server"
import * as module from "../index"
import { setLogLevel } from "../logger"
import { Site } from "../site"

describe("module", () => {
  test("exports expected module elements", () => {
    expect(module.Site).toBe(Site)
    expect(module.setLogLevel).toBe(setLogLevel)

    expect(module.encodeClientHeader).toBe(encodeClientHeader)
    expect(module.decodeClientHeader).toBe(decodeClientHeader)
    expect(module.parseClientToken).toBe(parseClientToken)

    expect(module.encodeServerHeader).toBe(encodeServerHeader)
    expect(module.decodeServerHeader).toBe(decodeServerHeader)
  })
})
