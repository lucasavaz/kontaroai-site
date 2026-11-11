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
SITE_URL=https://kontaro.ai APP_SIGNUP_URL=https://relay.kontaro.ai/signup node build.js
```

## Deploy on Render (static site)

1. New → **Static Site** and connect the repo that holds this folder.
2. Build command: `npm i -D playwright && npx playwright install chromium && node build.js`
3. Publish directory: `dist`
4. Environment: `SITE_URL=https://kontaro.ai` and `LEAD_ENDPOINT=<your lead URL>`
5. Custom domains: `kontaro.ai` and `www.kontaro.ai`. They already point to `kontaro-site.onrender.com`, so you can either replace that service's contents or move the domains to the new static site.

Alternatively, run the build on your own computer and upload `dist/` to any static host.

## Pages

| Page | PT | EN | ES |
|---|---|---|---|
| Home | / | /en/ | /es/ |
| Pricing | /precos/ | /en/pricing/ | /es/precios/ |
| Plan | /precos/essencial/, /crescimento/, /escala/ | /en/pricing/starter/, /growth/, /scale/ | /es/precios/esencial/, /crecimiento/, /escala/ |
| FAQ | /duvidas/ | /en/faq/ | /es/preguntas/ |
| Sign-up | /criar-conta/ | /en/signup/ | /es/crear-cuenta/ |
| Login | /entrar/ | /en/login/ | /es/iniciar-sesion/ |

All pages come from `src/index.html` (sections are shown per page with `data-pages`); `build.js` pre-renders each one. The homepage keeps every section. URL maps live in `PAGES`/`PLAN_SLUG` (index.html) and `build.js`; keep them in sync.

Sign-up/login: `AUTH_MODE=app` (default) sends people to the Relay app (`#signup` / `#login`); `AUTH_MODE=api` uses the on-site forms against the Relay API. See RELAY-DEV-SPEC.md for what Relay must change first.

## Sign-up (homepage form)

All "Start free" buttons lead to the sign-up form (name + email). On submit, the visitor goes to `APP_SIGNUP_URL` (default `https://relay.kontaro.ai/signup`) with `?lang=pt|en|es`. Name and email travel in the URL **hash** (`#name=...&email=...`), which is never sent to servers or leaked in referrers, so the app can pre-fill its form. The app handles email verification. "Create campaign" in the AI demo also opens the sign-up page.

Optional: if `LEAD_ENDPOINT` is set, the form also POSTs `{ name, email, lang, source }` there first, so you keep leads who don't finish signing up.

## Language

`/` is Portuguese, `/en/` English, `/es/` Spanish. On a first visit to `/`, the page picks a language from the browser language, then the time zone (Brazil → PT, Spanish-speaking Latin America/Spain → ES, else EN), and redirects. A choice made with the PT/EN/ES switch is remembered. Direct links to `/en/` or `/es/` never redirect, and search engines are never redirected. The switch and brand names are marked `translate="no"` so Chrome's auto-translate can't turn "EN" into "IN".

## Blog

The blog lives in `public/` (`/blog/` EN, `/pt-br/blog/` PT, `/es/blog/` ES) and is copied into `dist/` by the build. To add a post, copy an existing post folder, edit it, add it to that language's `index.html` and `feed.xml`, and add it to `POSTS` in `src/index.html` to feature it on the homepage.

## Pricing explainer and calculator

The "How billing works" section (`#billing`) explains the three parts of a customer's bill (Kontaro plan, Meta per-message fees, AI usage) and has a cost estimator. Meta's rates live in `RATES` in `src/index.html` (USD per delivered message, Meta rate card effective 2026-10-01; service messages are billed at the utility rate since that date). **Meta can change rates on Jan 1, Apr 1, Jul 1 and Oct 1. Update `RATES` and the dates in the copy every quarter** from https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

## Legal pages

`/terms/` and `/privacy/` are English DRAFTS with a visible "Draft" note. Have a lawyer review them (US/Florida, Brazil LGPD, EU GDPR), confirm governing law, then remove the `.draft` paragraph in `public/terms/index.html` and `public/privacy/index.html`.

## Testimonials

A testimonials section is built but hidden (`id="testimonials"` in `src/index.html`). Add real customer quotes, with their permission, then remove `hidden`.

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
- "14 days free · No credit card · Cancel anytime" and "nothing is charged automatically"
- Pricing in `PLANS`/`PLAN_TXT`: Starter R$197 / US$49, Growth R$497 / US$129, Scale R$1,297 / US$329 per month; yearly = 2 months free (a proposal, confirm before launch)
- AI allowances (500 / 2,500 / 10,000 AI conversations) and extra packs (1,000 for R$99 / US$25); at the limit the AI pauses and chats go to the team, with no automatic charge
- How Meta fees are paid (direct to Meta, or passed through at cost with no markup) and that campaigns show the estimated Meta cost before sending
- That AI providers don't train on customer messages (Privacy Policy)
- LinkedIn URL `https://www.linkedin.com/company/kontaro-ai/` (create the page with this handle, or change the link)
- Public API at `api.kontaro.ai/v1/messages` (the sample request in the developers tab)

All numbers in the demos are labeled as sample data.

## Still needed

- `/privacy` and `/terms` pages. They're linked in the footer, and Meta requires a privacy policy URL for app review.
- A real contact channel (the Kontaro WhatsApp number) once one exists.
