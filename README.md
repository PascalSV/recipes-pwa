# recipes-pwa
PWA recipes app for cloudflare

## Setup

1. Install dependencies: `npm install`
2. Create a KV namespace: `wrangler kv:namespace create "RECIPES"`
3. Update `wrangler.toml` with the KV namespace ID and zone ID for your domain.
4. Replace the placeholder icon files (`icon-192.png` and `icon-512.png`) with actual PNG icons (192x192 and 512x512 pixels). You can generate them at https://favicon.io/favicon-generator/ using a cooking-themed icon.
5. Run locally: `npm run dev`
6. Deploy: `npm run deploy`

## Features

- Store and display kitchen recipes
- Built with OnsenUI for mobile-friendly UI
- Uses Cloudflare Workers for backend and serving
