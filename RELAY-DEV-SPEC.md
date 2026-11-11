# Kontaro website ↔ Relay app: changes needed in Relay

The website (kontaro.ai) now has its own sign-up and login pages:

| Page | PT | EN | ES |
|---|---|---|---|
| Sign-up | /criar-conta/ | /en/signup/ | /es/crear-cuenta/ |
| Login | /entrar/ | /en/login/ | /es/iniciar-sesion/ |

Today they run in **app mode** (`AUTH_MODE=app`): they explain the steps and send people to `https://relay.kontaro.ai/#signup` or `/#login`. The website already contains working forms for **api mode**, which talk to the Relay API directly so users never leave kontaro.ai until they're logged in. To switch to api mode, Relay needs three small changes:

## 1. CORS on relay-whatsapp-api.onrender.com

Allow these origins for `POST /api/login`, `POST /api/auth/register`, `POST /api/auth/forgot-password` (with `Content-Type: application/json`, preflight `OPTIONS` included):

- https://kontaro.ai
- https://www.kontaro.ai

Today the browser blocks these requests ("Failed to fetch" from kontaro.ai).

## 2. Session hand-off in the app (relay.kontaro.ai)

After a successful login or sign-up, the website redirects to:

```
https://relay.kontaro.ai/#session=<token>&email=<email>
```

The app's hash router already handles `#login`, `#signup`, `#forgot`, `#activate=…`, `#reset=…`, `#verify=…`. Add `session`: read the token, store it exactly like a normal login does (the same function called after `/api/login`), then clear the hash with `history.replaceState`. The fragment is never sent to any server.

(If you prefer not to put the token in the URL, add `POST /api/auth/handoff` returning a one-time code valid for 60 seconds, and `#handoff=<code>` in the app; tell us and we'll switch the website to it.)

## 3. Payloads the website sends (same as the app today)

- `POST /api/auth/register` `{ name, workspace, email, password, lang }` → expects `{ token, email }`
- `POST /api/login` `{ email, password }` → expects `{ token, email }`
- `POST /api/auth/forgot-password` `{ email, lang }`
- Errors: JSON `{ "error": "message" }` with a non-2xx status (shown to the user as-is)

The website can also pre-fill the app: the homepage form sends people to the sign-up page with `#name=…&email=…`.

## Also promised on the website (please confirm or build)

- When a workspace reaches its plan's AI-conversation limit: AI pauses, chats go to the team, no automatic charge.
- Before a campaign is sent: show the number of recipients and Meta's estimated cost.
- Plan limits: Essencial 500 / Crescimento 2,500 / Escala 10,000 AI conversations; 2 / 5 / 15 users; 1,000 / 10,000 / 50,000 campaign contacts per month; Escala up to 5 WhatsApp numbers.

## Switching the website to api mode

Rebuild with `AUTH_MODE=api node build.js` (or change `AUTH_MODE` default in build.js) and redeploy.
