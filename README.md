# FireFiles

A full-stack meeting notes and transcription workspace inspired by Fireflies.ai, built as an SDE Fullstack Assignment.

FireFiles is an educational clone. It is not affiliated with, endorsed by, or an official product of Fireflies.ai.

## Overview

FireFiles demonstrates the post-meeting workflow of a productivity application: persist meeting records, browse and filter a meeting library, inspect structured notes and transcripts, synchronize transcript timestamps with a player, import transcripts, and manage meetings and action items.

The project intentionally uses fictional seed data and a single demo workspace. Real speech-to-text, authentication, live meeting capture, third-party integrations, and generative AI are outside the assignment scope.

## Features

### Meeting Library

- Persisted meetings with title, date, duration, source, optional media, and participants
- Case-insensitive title search
- Partial, case-insensitive participant filtering
- Inclusive date-range filtering
- Newest-first and oldest-first sorting

### Meeting Workspace

- Meeting summaries, action items, topics, and chapters
- Ordered, speaker-labelled transcript segments with timestamps
- Find-in-transcript search, highlighting, and previous/next match navigation
- Local Smart Search filters for questions, tasks, metrics, and date/time mentions
- Topic trackers and speaker talk-time derived from stored meeting data
- Interactive timeline/player with seeking, skip controls, and playback speed
- Timestamp seeking from transcripts, chapters, and action items
- Active transcript highlighting and playback-follow synchronization

### CRUD

- Create, edit, and delete meetings
- Create, edit, complete/reopen, reassign, and delete action items

### Transcript Import

- Paste timestamped transcripts into a new or existing meeting
- Upload TXT, JSON, and VTT transcript files
- Confirm replacement before overwriting an existing transcript
- Preserve the existing transcript if replacement input is invalid

### UX

- Loading, error, retry, empty, validation, and disabled states where relevant
- Fireflies-inspired, desktop-first productivity layout
- Placeholder routes that make intentionally out-of-scope surfaces explicit

## Out of Scope and Placeholders

The assignment permits placeholders for non-core product surfaces. FireFiles therefore represents the following areas in navigation or disabled UI without claiming that they are functional:

- Authentication and user profile management
- Ask FireFiles / conversational AI
- Live meeting capture bot and meeting status monitoring
- External integrations
- Team analytics and administration
- Sharing and collaboration
- Account and billing management

There is no real authentication, AI chat, sharing, speech-to-text, meeting bot, or integration provider behind these placeholders.

## Tech Stack

Versions below come from the committed dependency manifests and lockfile.

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16.3.2, React 19.2.8, TypeScript 5.9.3, Tailwind CSS 4.3.3 |
| Backend | Python 3.12, FastAPI 0.141.1, SQLAlchemy 2.0.52, Pydantic 2.13.4, Alembic 1.19.1 |
| Database | SQLite |
| Validation | pytest 9.1.1, ESLint 9.39.5, Next.js production build |

## Architecture

```text
Browser
   |
   v
Next.js frontend
   |
   | REST/JSON
   v
FastAPI
   |
   v
SQLAlchemy
   |
   v
SQLite
```

- **Frontend:** renders the UI, owns browser state and interactions, performs transcript search/playback synchronization, and calls the backend through typed API modules.
- **Backend:** defines HTTP routes, validates request/response data with Pydantic, applies service-layer rules, parses transcript imports, and coordinates persistence.
- **Database:** stores meetings, reusable participants, structured transcript segments, summaries, action items, topics, and chapters. Alembic owns schema migrations.

The frontend API base URL is centralized in `frontend/src/lib/api/client.ts` through `NEXT_PUBLIC_API_URL`; deployment environments should change that variable rather than hard-code API URLs in components.

## Repository Structure

```text
FireFiles/
├── frontend/
│   └── src/
│       ├── app/                 # Next.js routes
│       ├── components/          # Layout, meeting, detail, upload, and UI components
│       └── lib/                 # Typed API client, formatting, search, and playback utilities
├── backend/
│   ├── app/
│   │   ├── api/                 # FastAPI routers
│   │   ├── core/                # Environment-backed configuration
│   │   ├── db/                  # SQLAlchemy base, engine, and sessions
│   │   ├── models/              # ORM models
│   │   ├── parsers/             # TXT, JSON, and VTT transcript parsing
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── seed/                # Fictional fixtures and idempotent seeder
│   │   └── services/            # Meeting, action-item, and transcript logic
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest suite
│   └── requirements.txt
├── design-reference/stitch/     # Tracked, non-runtime design reference exports
├── AGENTS.md
└── README.md
```

The Stitch exports were implementation references only; they are not required to install, build, test, or run FireFiles.

## Database Design

The application schema contains eight tables:

| Table | Purpose |
| --- | --- |
| `meetings` | Meeting metadata, duration, optional media URL, and source type |
| `participants` | Reusable people with optional unique email and avatar URL |
| `meeting_participants` | Many-to-many meeting membership plus organizer status |
| `transcript_segments` | Ordered speaker turns with start/end timestamps and text |
| `summaries` | Zero-or-one current summary per meeting |
| `action_items` | Ordered tasks with completion state, optional assignee, and optional seek timestamp |
| `topics` | Ordered meeting topic labels |
| `chapters` | Ordered meeting sections with summaries and seek ranges |

A meeting owns its transcript segments, summary, action items, topics, chapters, and participant association rows. Deleting a meeting cascades through those owned records while leaving reusable participant records intact. Participants can be shared across meetings through `meeting_participants`. Transcript speakers and action-item assignees are nullable participant references; removing a participant from a meeting is rejected while that meeting's content still references them.

### Time Representation

- Meeting duration: integer **seconds**
- Transcript, chapter, and action-item seek timestamps: integer **milliseconds**
- Meeting dates: datetime values, transported by the API as ISO 8601 strings

Numeric timestamps are intentional: they avoid parsing display strings during playback and provide reliable transcript/player synchronization.

## Prerequisites

- Node.js 20.9.0 or newer and npm (required by the installed Next.js version)
- Python 3.12 or newer
- SQLite CLI is optional; Python includes the SQLite driver used by the application

The shell commands below are written for macOS/Linux and run from the repository root unless noted.

## Backend Setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

`backend/.env.example` is the source of truth:

```dotenv
ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite:///./firefiles.db
```

The default relative database URL creates `backend/firefiles.db` when commands are run from `backend/`. Local `.env` and SQLite files are ignored; do not commit secrets or runtime databases.

`FRONTEND_URL` is the browser origin allowed by the backend's CORS configuration. Set it to the deployed frontend origin outside local development.

### Database Migrations

With the backend virtual environment active and the current directory set to `backend/`:

```bash
python -m alembic upgrade head
```

This creates or updates the SQLite schema using the committed Alembic migrations. The application does not use startup-time `create_all` for its production schema.

### Seed Data

After applying migrations:

```bash
python -m app.seed.seeder
```

The seeder creates six realistic fictional meetings and is idempotent: repeated normal runs skip canonical meetings that already exist and can complete a partially seeded database.

To replace only the canonical seeded meetings:

```bash
python -m app.seed.seeder --reset
```

> **Warning:** `--reset` removes and recreates the six canonical seeded meetings. It preserves unrelated user-created meetings and participants still referenced elsewhere.

### Run the Backend

```bash
python -m uvicorn app.main:app --reload
```

- API: [http://localhost:8000](http://localhost:8000)
- Swagger/OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

## Frontend Setup

Open another terminal from the repository root:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

The local configuration should contain:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Open [http://localhost:3000](http://localhost:3000). Do not commit `.env.local`. For deployment, set `NEXT_PUBLIC_API_URL` to the deployed backend origin before building the frontend.

## Quick Start

After completing the one-time dependency installation, migration, and seed steps:

**Terminal 1**

```bash
cd backend
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

**Terminal 2**

```bash
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000), open the Meetings library, and select a seeded meeting.

## Main Workflows

1. **Browse meetings:** search by title, filter by participant/date, change sort order, and open a persisted meeting.
2. **Review a meeting:** read the summary, topics, chapters, action items, and speaker-labelled transcript.
3. **Navigate playback:** play the real media URL when present or use the simulated timeline; select transcript/chapter/action-item timestamps to seek and observe active-segment synchronization.
4. **Find transcript content:** enter a phrase, move through highlighted matches, or apply local Smart Search categories.
5. **Manage records:** create/edit/delete meetings and create/edit/complete/reopen/reassign/delete action items.
6. **Import a transcript:** select or create a meeting, paste timestamped text or upload a supported file, and explicitly confirm replacement when a transcript already exists.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/api/meetings` | Filtered, sorted, paginated meeting list |
| `GET` | `/api/meetings/{meeting_id}` | Full meeting workspace data |
| `POST` | `/api/meetings` | Create a meeting |
| `PATCH` | `/api/meetings/{meeting_id}` | Partially update a meeting |
| `DELETE` | `/api/meetings/{meeting_id}` | Delete a meeting and owned records |
| `POST` | `/api/meetings/{meeting_id}/action-items` | Create an action item |
| `PATCH` | `/api/action-items/{action_item_id}` | Edit, complete/reopen, or reassign an action item |
| `DELETE` | `/api/action-items/{action_item_id}` | Delete an action item |
| `POST` | `/api/meetings/{meeting_id}/transcript/paste` | Import timestamped text |
| `POST` | `/api/meetings/{meeting_id}/transcript/upload` | Upload a TXT, JSON, or VTT transcript |

Swagger at [http://localhost:8000/docs](http://localhost:8000/docs) provides the complete generated request and response schemas.

### Meeting List Query Parameters

`GET /api/meetings` accepts:

| Parameter | Behavior |
| --- | --- |
| `search` | Case-insensitive partial title match |
| `participant` | Case-insensitive partial participant-name match |
| `date_from` | Inclusive lower date bound (`YYYY-MM-DD`) |
| `date_to` | Inclusive upper date bound (`YYYY-MM-DD`) |
| `sort` | `newest` (default) or `oldest` |
| `limit` | Page size from 1 to 100; default 20 |
| `offset` | Non-negative row offset; default 0 |

When both dates are supplied, `date_from` must be on or before `date_to`.

## Transcript Import Formats

All transcript uploads must be UTF-8 and no larger than 5 MiB. Imported timestamps must fit within the target meeting duration.

### Pasted Text and TXT

Each non-empty line uses a timestamp, speaker name, and text:

```text
[00:00] Amara Voss: Welcome everyone.
[00:18] Dev Malik: Let's review the remaining tasks.
[01:02:18] Nina Calder: Let's revisit the deployment plan.
```

Both `MM:SS` and `HH:MM:SS` are supported. Start timestamps must be strictly increasing. Because this format omits end times, each segment ends at the next segment's start; the final segment ends at the meeting duration.

### JSON

The root must be a non-empty array. Every object must contain exactly `speaker`, `start_time_ms`, `end_time_ms`, and `text`:

```json
[
  {
    "speaker": "Amara Voss",
    "start_time_ms": 0,
    "end_time_ms": 10000,
    "text": "Welcome everyone."
  }
]
```

Timestamp fields must be non-negative integers in chronological order, and an end timestamp cannot precede its start.

### WebVTT

VTT files must begin with `WEBVTT`. Each supported cue contains one timing line followed by one `Speaker Name: text` line, for example:

```text
WEBVTT

00:00:00.000 --> 00:00:05.000
Amara Voss: Welcome everyone.
```

The importer intentionally supports this focused speaker-cue subset rather than the entire WebVTT specification.

For meetings that already contain transcript segments, import endpoints return a conflict unless replacement is explicitly requested (`replace_existing=true`). The frontend presents a confirmation before sending that option.

## Seeded Demo Data

The seeder creates these six fictional meetings:

1. Product Weekly Sync
2. Sprint Planning — Mobile Release
3. Engineering Architecture Review
4. Customer Onboarding Review
5. Design Critique — Meeting Workspace
6. Q3 Growth Strategy

All names, email addresses, meetings, transcripts, summaries, and tasks in the seed fixtures are fictional demo content.

## Important Design Decisions

### Participants

Participants are reusable across meetings. A case-insensitive email match is used as the safe reuse key when email is available; a name without an email is not treated as a global identity.

### Transcript Storage

Transcripts are stored as ordered segments rather than one large text blob. This makes speakers, timestamp seeking, highlighting, filtering, and player synchronization straightforward.

### Summaries

Each meeting has zero or one current summary, enforced by a unique database relationship. This assignment does not model summary history.

### Referential Safety

Deleting a meeting cascades through meeting-owned data but not reusable participants. Meeting participant removal is blocked when the participant is still referenced as a transcript speaker or action-item assignee, and action-item assignees must belong to that meeting.

### Player

When `media_url` is available, the browser uses it as an audio source. Meetings without usable media use an interactive simulated timeline based on stored duration, so timestamp seeking and transcript synchronization can be evaluated without speech-to-text or hosted audio.

## Testing and Validation

Backend tests:

```bash
cd backend
source .venv/bin/activate
python -m pytest
```

Frontend static and production-build checks:

```bash
cd frontend
npm run lint
npm run build
```

The repository does not include browser automation tests.

## Known Limitations

- No authentication or multi-user authorization
- Ask FireFiles and other generative AI surfaces are placeholders
- No speech-to-text engine or live meeting capture bot
- No real integration providers, team collaboration, sharing, or billing
- A simulated player is used when a meeting has no usable media URL
- SQLite is used for assignment simplicity rather than production-scale concurrency

## Assumptions

- The application represents one demo/logged-in workspace.
- Transcript and derived meeting data may be seeded or imported rather than generated by AI.
- A media source is optional.
- Action-item assignees must be members of the same meeting.
- The UI is desktop-first because the assignment targets a Fireflies-style web workspace.

## Deployment

- Backend target: Railway, using `backend/` as the service root and `/backend/railway.toml` as the config file path.
- Railway builds the backend with Railpack and starts it with `./start.sh`. The script applies Alembic migrations, runs the idempotent demo seeder without `--reset`, and then starts Uvicorn on Railway's provided port.
- Attach a persistent volume to the backend service at `/data`, then set `DATABASE_URL=sqlite:////data/firefiles.db` so SQLite data survives deployments.
- Set `ENV=production` and set `FRONTEND_URL` to the real Vercel origin after the frontend is deployed. Do not include a trailing slash in the origin.
- Frontend target: Vercel (pending deployment).

## Live Deployment

- **Frontend:** https://fire-files.vercel.app
- **Backend API:** https://firefiles-production.up.railway.app
- **Swagger / API Docs:** https://firefiles-production.up.railway.app/docs


## Disclaimer

FireFiles is an educational clone created for a software engineering assignment and is not affiliated with Fireflies.ai.
