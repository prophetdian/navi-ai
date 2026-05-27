# NAVI AI — Project TODO

## Core Infrastructure
- [x] Database schema: users, chat_sessions, chat_messages, subscriptions tables
- [x] Apply DB migrations
- [x] Upload NAVI mascot image to static assets

## Backend (tRPC Routers)
- [x] chat.send — Claude response with mode-specific system prompts
- [x] chat.history — list sessions per user
- [x] chat.session — get messages for a session
- [x] chat.newSession — create new session
- [x] chat.deleteSession — delete a session
- [x] chat.export — export session as markdown/text
- [x] files.upload — upload file to S3, return URL
- [x] voice.transcribe — Whisper transcription from audio URL
- [x] images.generate — image generation via built-in helper
- [x] search.web — live web data fetch via Manus data API
- [x] payments.createOrder — PayPal order creation (ready, credentials pending)
- [x] payments.captureOrder — PayPal order capture (ready, credentials pending)
- [x] payments.createSubscription — PayPal subscription creation (ready, credentials pending)
- [x] payments.status — check user payment/subscription status

## Frontend Pages & Components
- [x] Global dark futuristic theme with cyan accents and Fredoka font
- [x] Landing/welcome page with NAVI mascot, orbit rings, features grid
- [x] PayPal payment gate page (subscription + one-time options, ready for credentials)
- [x] Main chat interface with sidebar (session history)
- [x] Chat mode selector (Agent, Chat, Code, Research)
- [x] Message display with Streamdown markdown rendering
- [x] File upload UI (button + attach preview)
- [x] Voice input button with MediaRecorder
- [x] Image generation trigger in chat
- [x] Web search toggle in chat
- [x] Export chat button (Markdown / Text)
- [x] User auth (login/logout via Manus OAuth)

## Tests
- [x] Vitest: auth router tests (me, logout)
- [x] Vitest: chat router tests (sessions, session, deleteSession, export)
- [x] Vitest: payment status test

## Pending (awaiting user input)
- [ ] PayPal live credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, VITE_PAYPAL_CLIENT_ID)
- [ ] Optional: VITE_PAYPAL_MONTHLY_PLAN_ID for subscription plan
