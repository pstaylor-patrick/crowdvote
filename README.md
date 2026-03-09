# CrowdVote

**Real-time crowd interaction for live events, meetings, and presentations.**

CrowdVote lets a host display a QR code on screen, and anyone in the audience can scan it to instantly join and vote — no app download, no sign-up, no friction. Results update live on the projector as votes come in.

## What It Does

1. **Host creates a session** with questions and answer options
2. **Host projects the screen** showing a large QR code and join code
3. **Audience scans the QR** code with their phone camera
4. **Questions appear on phones** — attendees tap to vote
5. **Results animate live** on the projector as votes roll in
6. **Host controls the pace** — advance questions, reveal results, end session

## Use Cases

- **Superlatives / Roast Games** — "Most likely to..." with people's names as options. Perfect for team offsites, leadership events, and holiday parties.
- **Live Polls** — Get instant audience feedback during presentations, town halls, or all-hands meetings.
- **Zoom Energizers** — Break up long remote meetings with quick interactive polls. Share your screen, drop the QR in chat.
- **Webinar Surveys** — Engage your audience during webinars with real-time polling.
- **Shareholder Votes** — Quick yes/no votes during board meetings or community gatherings.
- **Classroom Response** — Teachers can gauge understanding in real-time.
- **Trivia Nights** — Run pub trivia with instant scoring (quiz mode coming soon).

## How It Works

### For Hosts

1. Go to `/dashboard` and create a new session
2. Add questions with multiple choice options
3. For "roast" mode: define people's names once, they apply to all questions
4. Click **Open Lobby** — a QR code appears on the presentation screen
5. Click **Begin** to push the first question to all connected phones
6. Watch vote counts animate in real-time on the projector
7. Click **Reveal** to show the bar chart results
8. Click **Next** to advance, or **End Session** when done

### For Attendees

1. Point phone camera at the QR code on screen
2. That's it. You're in. No download, no sign-up.
3. Questions appear automatically on your phone
4. Tap your answer
5. See the results when the host reveals them
6. Next question appears automatically

## Tech Stack

| Layer      | Technology                                                                        |
| ---------- | --------------------------------------------------------------------------------- |
| Framework  | [Next.js 15](https://nextjs.org/) (App Router)                                    |
| Monorepo   | [Turborepo](https://turbo.build/)                                                 |
| Database   | [Neon Postgres](https://neon.tech/) (serverless)                                  |
| ORM        | [Drizzle](https://orm.drizzle.team/)                                              |
| Real-time  | [Upstash Redis](https://upstash.com/) Streams + Server-Sent Events                |
| UI         | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/)                                   |
| QR Codes   | [qrcode.react](https://github.com/zpao/qrcode.react) (SVG, crisp at any size)     |
| Hosting    | [Vercel](https://vercel.com/)                                                     |

### Why These Choices

- **No WebSocket server needed** — Redis Streams + SSE work on standard serverless (Vercel, Netlify, etc.)
- **Zero client-side dependencies for attendees** — just a browser. No app, no SDK, no login.
- **SVG QR codes** — razor-sharp on any projector resolution
- **Drizzle over Prisma** — lighter, faster cold starts on serverless
- **Tailwind v4** — native CSS, no config file, zero runtime

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech/) Postgres database (free tier works)
- An [Upstash](https://upstash.com/) Redis instance (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/pstaylor-patrick/crowdvote.git
cd crowdvote

# Create your env file
mkdir -p ../crowdvote.data
cp .env.example ../crowdvote.data/.env.local
# Edit ../crowdvote.data/.env.local with your actual values

# The repo uses symlinks to a single env file:
ln -sf ../crowdvote.data/.env.local .env.local

# Install dependencies
npm install

# Push the database schema
cd apps/web
npx drizzle-kit push
cd ../..

# Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating sessions.

### Environment Variables

```bash
POSTGRES_URL=            # Neon Postgres connection string
REDIS_URL=               # Upstash Redis URL (rediss://...)
APP_URL=                 # Your domain (e.g., https://getcrowdvote.com)
ADMIN_PASSWORD=          # Password for the host dashboard (optional, leave empty for dev)
```

### Admin Authentication

Set `ADMIN_PASSWORD` in your env to protect the host dashboard (`/dashboard`, `/session/*`). When set, hosts must enter the password to access session management. Leave it empty during development to skip auth entirely.

Attendees are always anonymous — scan the QR and vote. No auth, no friction.

## Project Structure

```
crowdvote/
├── apps/web/              # Next.js 15 application
│   ├── app/
│   │   ├── (host)/        # Host dashboard, session control, presentation view
│   │   ├── (attendee)/    # QR join page, voting UI
│   │   └── api/           # REST endpoints + SSE streaming
│   ├── components/        # UI components (shadcn/ui + custom)
│   ├── hooks/             # useSSE real-time hook
│   └── lib/               # Database, Redis, SSE helpers
├── packages/types/        # Shared TypeScript types
└── crowdvote.data/        # Env file (gitignored, symlinked)
```

## Real-Time Architecture

CrowdVote uses **Redis Streams** for reliable, ordered event delivery over **Server-Sent Events (SSE)**:

1. Host actions (advance question, reveal results) write events to a Redis Stream
2. Each connected client has an SSE connection that reads from the stream
3. Events are delivered in order with automatic reconnection
4. No WebSocket server required — works on standard serverless infrastructure

## Deployment

Deploy to Vercel in one click, or any platform that supports Next.js:

```bash
# Build
npm run build

# Or deploy to Vercel
vercel deploy
```

Make sure your environment variables are configured in your deployment platform.

## Roadmap

- [ ] Timer/countdown per question
- [ ] AI-generated commentary (DeepSeek integration)
- [ ] Quiz mode with scoring
- [ ] Free text and rating question types
- [ ] Session templates for quick setup
- [ ] Shareable results links
- [ ] Sound effects and music
- [ ] Multi-host support with OAuth

## License

MIT License — use it for your own events, hack nights, classrooms, whatever you want.

---

**Built for the F3 Nation leadership community.** If you're looking for a free, open-source tool to run live interactive sessions at your next event, CrowdVote is it.
