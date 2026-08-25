# OTHERWORK / HAIR — MVP

**You do the hair. We handle the other work.**

## Working now
- Today dashboard and appointments
- People / client CRM
- Cancellation Rescue + waitlist matching
- Dedicated Color Lab / Formula Library
- Formula cost calculation from product prices and grams used
- Product / backbar cost library
- Product usage tracking
- Service profitability and effective hourly rate
- Retail shop margin snapshot
- Ask Otherwork business insights concept
- Persistent local data

## Run
Requires Node.js 18+. Run `npm start`, then open `http://localhost:3000`.

## Production next
Multi-tenant accounts, authentication, cloud database, payment connections, SMS/email reminders, client booking websites, tax reporting, receipt scanning + AI product cost lookup, inventory forecasting, subscriptions, and public deployment.


## v3 added
- Clickable client profiles
- Client formula timeline
- Appointment history per client
- Multi-part color formulas (root/base, gloss/toner, lightener/other)
- One-click new formula from a client profile
- Formula history stays tied to each client

## v4 added
- Saving a color formula automatically deducts exact grams/ml from backbar inventory
- Every formula component creates a costed product-usage record
- Live stock levels and low-stock flags
- Backbar inventory value
- Formula profitability API connecting product cost to appointment revenue
- Formula save confirmation now reflects stock + cost recording

## v5 added
- Dedicated Checkout screen
- Checkout directly from open appointments
- Track service price, retail add-ons, tips, and payment method
- Manual payment methods: Square/Card, Venmo, PayPal, Zelle, Cash, Other
- Retail stock decreases automatically when sold
- Sales tax calculation using the business tax-rate setting
- Checkout records stored persistently
- Gross-after-product calculation combining service product cost + retail COGS
- Money summary API for revenue, tax collected, tips, and gross-after-product

## v6 added
- Public client booking page at `/book`
- Customizable business name, stylist name, bio, location, and accent color
- Public booking creates a client + appointment automatically
- Appointment confirmations/reminder records are scheduled
- Reminder dashboard with 24h / 2h reminder workflow
- Demo reminder sending
- Website customization screen with booking-site preview
- Foundation for future custom domain + white-label client site

## v7 added
- Much richer stylist website builder
- Background, text, and accent color customization
- Four built-in indie/editorial font directions using safe system fonts
- Custom hero headline and subhead
- Optional About, Work, Services, and Shop sections
- Instagram link
- Portfolio / Selected Work section
- Add and remove portfolio pieces
- Public booking site now reflects stylist colors, font choice, content, work, and retail
- Foundation for future direct image uploads and custom domains

## v8 added
- Local sign-in gate and session cookies
- Seeded demo account: `demo@otherwork.local` / `otherworkdemo`
- Password hashing with PBKDF2-SHA256
- Private API authentication gate
- Account/business workspace data foundation
- Direct JPG / PNG / WEBP photo uploads from the stylist's device
- 5MB image limit and local upload storage
- Portfolio photos no longer require pasted image URLs
- Sign-out control
- Important: this is still local-MVP authentication, not production auth or complete multi-tenant isolation

## v9 added — deployable beta structure
- Docker deployment support
- Render blueprint with persistent disk
- `/health` endpoint
- Configurable persistent database and upload directories
- PWA manifest + service worker
- Home-screen install support for iPhone/iPad/Android after HTTPS deployment
- Mobile app icon
- In-app install instructions
- Deployment guide in `DEPLOY.md`

This version is meant to be the bridge from local MVP to a live beta URL.
