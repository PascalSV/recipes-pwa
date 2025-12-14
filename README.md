# recipes-pwa
PWA recipes app for cloudflare

## Setup

1. Install dependencies: `npm install`
2. Create a KV namespace: `wrangler kv:namespace create "RECIPES"`
3. Update `wrangler.toml` with the KV namespace ID.
4. Run locally: `npm run dev`
5. Deploy: `npm run deploy`

## Features

- Store and display kitchen recipes
- Built with OnsenUI for mobile-friendly UI
- Uses Cloudflare Workers for backend and serving
