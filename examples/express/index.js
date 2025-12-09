import express from "express";
import { Site, FEATURES } from "@zeroad.network/token";

/**
 * Module initialization (once at startup)
 */

const site = Site({
  // Pass in `clientId` you received registering your site on Zero Ad Network platform
  clientId: "Z2CclA8oXIT1e0QmqTWF8w",
  // Specify supported site features only
  features: [FEATURES.CLEAN_WEB, FEATURES.ONE_PASS],
});

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------
function tokenMiddleware(req, res, next) {
  // Inject the "X-Better-Web-Welcome" server header into every response
  res.setHeader(site.SERVER_HEADER_NAME, site.SERVER_HEADER_VALUE);

  // Parse the incoming user token from the client header
  // Attach parsed token data to request for downstream use
  req.tokenContext = site.parseClientToken(req.headers[site.CLIENT_HEADER_NAME]);

  next();
}

// -----------------------------------------------------------------------------
// Express app setup
// -----------------------------------------------------------------------------
const app = express();
app.use(tokenMiddleware);

app.get("/", (req, res) => {
  // Access parsed `tokenContext` for this request
  const tokenContext = req.tokenContext;

  // Render HTML template using `tokenContext` to adjust feature display
  const state = (value) => (value && '<b style="background: #b0b0b067">YES</b>') || "NO";
  const template = `
    <html>
      <body>
        <h1>Hello</h1>
        <h3>Contents of "tokenContext" variable for this request:</h3>
        <pre style="display: inline-block; border: 1px solid #5b5b5ba4; padding: 0.5rem; background: #b0b0b067">tokenContext = ${JSON.stringify(tokenContext, null, 2)}</pre>

        <h3>Site Feature toggles to be used while rendering this page:</h3>
        <ul>
          <li>Hide Advertisements: ${state(tokenContext.HIDE_ADVERTISEMENTS)}</li>
          <li>Hide Cookie Consent Dialog: ${state(tokenContext.HIDE_COOKIE_CONSENT_SCREEN)}</li>
          <li>Hide Marketing Dialogs: ${state(tokenContext.HIDE_MARKETING_DIALOGS)}</li>
          <li>Disable 3rd Party non-functional tracking: ${state(tokenContext.DISABLE_NON_FUNCTIONAL_TRACKING)}</li>
          <li>Disable Content Paywalls: ${state(tokenContext.DISABLE_CONTENT_PAYWALL)}</li>
          <li>Enable Free access to your Base Subscription plan: ${state(tokenContext.ENABLE_SUBSCRIPTION_ACCESS)}</li>
        </ul>
      </body>
    </html>
  `;

  res.send(template);
});

app.get("/json", (req, res) => {
  // Return JSON response with `tokenContext` for API usage
  res.json({
    message: "OK",
    tokenContext: req.tokenContext,
  });
});

// -----------------------------------------------------------------------------
// Start Express server
// -----------------------------------------------------------------------------
app.listen(3000, () => {
  console.log(`Express server listening at port 3000
    · HTML template example:        http://localhost:3000
    · Plain JSON endpoint example:  http://localhost:3000/json`);
});
