# Kontaro website

A fast, static, multilingual marketing site (Portuguese, English, Spanish). It has no framework and no runtime dependencies, about 90 KB per page.

## Structure

- `src/index.html`: the single source. All copy is in the `I18N` object, and the animated demos are in `DEMO` and `SHEET`.
- `i18n-meta.json`: page titles and descriptions for search engines.
- `build.js`: pre-renders `/`, `/en/` and `/es/` with hreflang, canonical, Open Graph, JSON-LD, a sitemap, robots.txt and share images.
- `dist/`: the build output. Deploy this folder.

## Build

```bash
npm i -D playwright      # one time
SITE_URL=https://kontaro.ai LEAD_ENDPOINT=https://api.kontaro.ai/v1/leads node build.js
```

## Deploy on Render (static site)

1. New → **Static Site** and connect the repo that holds this folder.
2. Build command: `npm i -D playwright && npx playwright install chromium && node build.js`
3. Publish directory: `dist`
4. Environment: `SITE_URL=https://kontaro.ai` and `LEAD_ENDPOINT=<your lead URL>`
5. Custom domains: `kontaro.ai` and `www.kontaro.ai`. They already point to `kontaro-site.onrender.com`, so you can either replace that service's contents or move the domains to the new static site.

Alternatively, run the build on your own computer and upload `dist/` to any static host.

## Lead form

If `LEAD_ENDPOINT` is set, the form POSTs JSON `{ name, phone, lang, source }`. If it isn't set, the form shows a "preview" note. Add a small endpoint to the Relay API that saves the lead and sends you a WhatsApp alert. Protect that endpoint with rate limiting and validation.

## Before going live, check every claim

The copy describes these capabilities. Remove or label as "coming soon" anything that isn't live yet:

- AI answers from your website, PDFs and sheets, and replies in the customer's language
- "Ask your inbox" AI insights
- Managing campaigns by WhatsApp/Telegram message, with confirmation before sending
- Google Drive data sources → personalized campaigns
- WhatsApp + Instagram unified inbox, multiple teams, per-person permissions
- Opt-out handling ("anyone who asks to leave stops receiving")
- Export/delete contacts and conversations
- Guided connection with Facebook login (Meta Embedded Signup)
- "No card needed to try" and the "Start free" CTA
- Public API at `api.kontaro.ai/v1/messages` (the sample request in the developers tab)

All numbers in the demos are labeled as sample data.

## Still needed

- `/privacy` and `/terms` pages. They're linked in the footer, and Meta requires a privacy policy URL for app review.
- A real contact channel (the Kontaro WhatsApp number) once one exists.
