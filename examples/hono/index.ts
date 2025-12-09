import { Context, Hono, Next } from "hono";
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
// Hono app setup
// -----------------------------------------------------------------------------
type TokenContext = ReturnType<typeof site.parseClientToken>;
const app = new Hono<{ Variables: { tokenContext: TokenContext } }>();

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------
app.use("*", async (c: Context, next: Next) => {
  // Inject the "X-Better-Web-Welcome" server header into every response
  c.header(site.SERVER_HEADER_NAME, site.SERVER_HEADER_VALUE);

  // Parse the incoming user token from the client header
  const tokenContext = site.parseClientToken(c.req.header(site.CLIENT_HEADER_NAME));

  // Attach parsed token data to request for downstream use
  c.set("tokenContext", tokenContext);

  await next();
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.get("/", (c) => {
  // Access parsed `tokenContext` for this request
  const tokenContext = c.get("tokenContext");

  // Render HTML template using `tokenContext` to adjust feature display
  const state = (value: boolean) => (value && '<b style="background: #b0b0b067">YES</b>') || "NO";
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

  return c.html(template);
});

app.get("/json", (c) => {
  // Return JSON response with `tokenContext` for API usage
  const tokenContext = c.get("tokenContext");
  return c.json({
    message: "OK",
    tokenContext,
  });
});

// -----------------------------------------------------------------------------
// Start Hono server (for Bun.js)
// -----------------------------------------------------------------------------
Bun.serve({ fetch: app.fetch, port: 3000 });

console.log(`Hono server listening at port 3000
    · HTML template example:        http://localhost:3000
    · Plain JSON endpoint example:  http://localhost:3000/json`);
