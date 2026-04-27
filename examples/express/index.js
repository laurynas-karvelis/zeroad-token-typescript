/* eslint-disable no-console */
import path from "node:path"
import { FEATURE, Site } from "@zeroad.network/token"
import { Eta } from "eta"
import express from "express"

const app = express()

const eta = new Eta()

app.engine("eta", buildEtaEngine())
app.set("view engine", "eta")
app.set("views", path.join(import.meta.dirname, "../templates"))

const site = Site({
  clientId: process.env.ZERO_AD_CLIENT_ID || "DEMO-Z2CclA8oXIT1e0Qmq",
  features: [FEATURE.CLEAN_WEB, FEATURE.ONE_PASS],
  cacheConfig: {
    enabled: true,
    ttl: 10000,
    maxSize: 500,
  },
})

app.use(async (req, res, next) => {
  res.set(site.SERVER_HEADER_NAME, site.SERVER_HEADER_VALUE)
  req.tokenContext = await site.parseClientToken(req.get(site.CLIENT_HEADER_NAME))
  next()
})

app.get("/", async (req, res) => {
  res.render("homepage", {
    tokenContext: req.tokenContext,
  })
})

app.get("/api/premium-data", async (req, res) => {
  if (!req.tokenContext.ENABLE_SUBSCRIPTION_ACCESS) {
    res.status(403).json({
      error: "Premium subscription required",
      message: "Subscribe to Zero Ad Network to access this endpoint",
    })
    return
  }

  res.json({
    data: "This is premium content only available to Zero Ad Network subscribers",
    timestamp: new Date().toISOString(),
  })
})

function buildEtaEngine() {
  return (path, opts, callback) => {
    try {
      const fileContent = eta.readFile(path)
      const renderedTemplate = eta.renderString(fileContent, opts)
      callback(null, renderedTemplate)
    } catch (error) {
      callback(error)
    }
  }
}

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Zero Ad Network - Express.js Example                      ║
╚════════════════════════════════════════════════════════════╝

Server running at: http://localhost:${PORT}

Routes:
  • GET /                  - Homepage
  • GET /api/premium-data  - Premium API endpoint
  
Cache Config:
  • Enabled: true
  • TTL: 10000ms
  • Max Size: 500 entries
  `)
})
