## Introduction

**@zeroad.network/token** is a TypeScript ready module meant to be used by partnering sites of [Zero Ad Network](https://zeroad.network) platform. It's a lightweight module that works on Nodejs v18 and above, Bun v1.1.0 and above, and Deno v2.0.0 and above runtimes.

This module allows a Zero Ad Network program partnering sites and Web APIs to verify determine if incoming web requests are coming from our browser extension users with active subscription.

Their browser extension will send the `X-Better-Web-Hello` Request Header which will let our module to verify it's our actively subscribed user and will allow your site to make a decision whether to disable ads, paywalls or enable access to otherwise paid content of yours.

ZeroAd user browser extension will measure how many times and how long they spent on each resource of your website that sends the `X-Better-Web-Welcome` token. This information will go back to us and at the end of each month based on how large the active user base is and how much competition you got, you'll get awarded from each user's monthly subscription paid amount based on their usage patterns interacting with your site.

## Setup

If you already have your site registered with us, you can skip the section below.

### Register your website or web API

Sign up with us by navigating in your browser to [sign up](https://zeroad.network/login), once you've logged in successfully, go to and [add a project](https://zeroad.network/publisher/sites/add) page and register your site.

In the second step of the Site registration process you'll be presented with your unique `X-Better-Web-Welcome` header value for that site. Your website must respond with this header in all publicly accessible endpoints that contain HTML or RESTful response types. This will let ZeroAd Network users know that you are participating in the program.

## Module Installation

As it is written in TypeScript, all types and interfaces are available. Also, this package works well in `mjs` (ESM) and `cjs` (CJS - older node versions) environments. You choose to either use `import` or `require()` statements. Imports are always preferred.

Install this package using your favourite package manager:

```shell
# npm
npm add @zeroad.network/token

# or yarn
yarn add @zeroad.network/token

# or pnpm
pnpm add @zeroad.network/token

# or Bun
bun add @zeroad.network/token
```

# Examples

Take the simplest JavaScript example as a reference. The most basic, and honestly, quite complete use with `express` v.5 could look similar to this:

```js
import express from "express";
import { Site } from "@zeroad.network/token";

const app = express();

// Initialize your Zero Ad Network module
// Welcome Header Value acquired during Site Registration process at Zero Ad Network platform
const ZERO_AD_NETWORK_WELCOME_HEADER_VALUE = "AZqnKU56eIC7vCD1PPlwHg^1^3";
const site = Site(ZERO_AD_NETWORK_WELCOME_HEADER_VALUE);

app
  .use((req, res, next) => {
    // X-Better-Web-Welcome header injection can could have it's own simple middleware like this:
    res.set(site.SERVER_HEADER_NAME, site.SERVER_HEADER_VALUE);

    // Process request token from incoming client token header value.
    // And attach processed token info to request for downstream usage.
    req.tokenContext = site.parseToken(req.get[site.CLIENT_HEADER_NAME]);

    next();
  })
  .get("/", (req, res) => {
    // For example:
    console.log(req.tokenContext);

    // Will produce the following structure:
    req.tokenContext = {
      // If set to true: Render no advertisements anywhere on the page
      ADS_OFF: boolean,
      // If set to true: Render no Cookie Consent screens (headers, footers or dialogs) on the page with complete OPT-OUT for non-functional trackers
      COOKIE_CONSENT_OFF: boolean,
      // If set to true: Render no marketing dialogs or popups such as newsletter, promotion etc. on the page
      MARKETING_DIALOG_OFF: boolean,
      // If set to true: Provide automatic access to otherwise paywalled content such as articles, news etc.
      CONTENT_PAYWALL_OFF: boolean,
      // If set to true: Provide automatic access to site features provided behind a SaaS at least the basic subscription plan
      SUBSCRIPTION_ACCESS_ON: boolean,
    };

    // In your template adjust your content depending on tokenContext values
    res.render("index.ejs", { tokenContext });
  });

const port = 3000;

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
```

For all example implementations such as `Express.js` (JavaScript), `Hono` and `Fastify` (both are TypeScript), please go to [see more examples](https://github.com/laurynas-karvelis/zeroad-token-ts/tree/main/examples/).

P.S.: Each web request coming from active subscriber using their Zero Ad Network browser extension will incur a tiny fraction of CPU computation cost to verify the token data matches its encrypted signature. On modern web infrastructure a request execution time will increase roughly by ~0.06ms to 0.2ms or so. Mileage might vary, but the impact is minimal.

# Final thoughts

If no user of ours interacts with your website or web app, you lose nothing. You can keep showing ads to normal users, keep your paywalls etc.

We hope the opposite will happen and you'll realize how many people value pure, clean content created that is meant for them, actual people, that brings tangible and meaningful value for everyone.

Each website that joins us, becomes a part of re-making the web as it originally was intended to be - a joyful and wonderful experience once again.

**Thank you!**

> The "Zero Ad Network" team.
