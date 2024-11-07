# Oaklang

- Prod: https://oaklang.com
- Dev: http://localhost:3000

## Setup

```
git clone git@github.com:soaklander/oaklang.git
cd oaklang

# Make sure you have docker installed
docker compose up -d

# Make sure to define your own values
cp .env.example .env

pnpm i
pnpm migrate
pnpm dev

pnpm wakaq:worker
```

## Seed

```
# Supported Languages
pnpm seed
```

## Tech Stack

- [Next.js](https://nextjs.org) Web Framework
- [Drizzle](https://orm.drizzle.team/docs/overview) Database ORM
- [Tailwind CSS](https://tailwindcss.com) CSS Styling
- [shadcn/ui](https://ui.shadcn.com) UI Component Library
- [tRPC](https://trpc.io) End-to-end typesafe APIs
- [DigitalOcean App Platform](https://cloud.digitalocean.com/projects/dffbd5f9-9621-4bbf-a6f3-7b521f85b1bc) App hosting platform
- [Wakaq](https://github.com/wakatime/wakaq-ts) Background Task Queue
- [Resend](https://resend.com/) Email Server
- [React Email](https://react.email) Write emails using React and TypeScript
