# oaklang.com

- Prod: https://oaklang.com
- Dev: http://localhost:3000

## Setup

Install [Postgres](https://postgresapp.com/).

```
git clone git@github.com:soaklander/oaklang.git
cd oaklang
psql -c "CREATE ROLE oaklang WITH LOGIN SUPERUSER PASSWORD 'oaklang';"
psql -c "CREATE DATABASE oaklang WITH OWNER oaklang;"
psql -d oaklang -c "CREATE EXTENSION citext;"
cp .env.example .env
npm i
npm run migrate
npm run dev
```

## Reset DB

```
psql -c 'DROP DATABASE oaklang;'
psql -c "CREATE ROLE oaklang WITH LOGIN SUPERUSER PASSWORD 'oaklang';"
psql -c "CREATE DATABASE oaklang WITH OWNER oaklang;"
psql -d oaklang -c "CREATE EXTENSION citext;"
```

## Tech Stack

- [Next.js](https://nextjs.org)
- [Drizzle](https://orm.drizzle.team/docs/overview)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [DigitalOcean App Platform](https://cloud.digitalocean.com/projects/dffbd5f9-9621-4bbf-a6f3-7b521f85b1bc)

## Admin

To access your local admin, [get your user id](http://localhost:3000/me/id) and add to `ADMIN_USER_IDS` in your `.env` file.
Then visit http://localhost:3000/admin
