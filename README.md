# Service management app

Create services, sell tickets, keep track of events and contacts.

## Development

### 1. Create `.env` fiel in the root directory with the following contents

```env
# Connecting to Supabase with supabase-js
# https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase>


# Only required if on the prisma experiments branch

# Prisma Client
DATABASE_URL="postgres://postgres.<project-id>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# Prisma Direct connection to the database. Used for migrations.
DIRECT_URL="postgres://postgres.<project-id>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

Make sure to replace `<project-id>` and `<db-password>` with the actual values from supabase.

### 2. Runnig development

Use the VSCode debugger, or run using `npm run dev`

### 3. On changes in the db

Run `npm run generate:types` to update the supabase client
Run `npx prisma db pull` to update the prisma schema (under development on the branch `prisma-experiments`)

### 4. Before pushing

As vercel builds a preview for each commit on all branches, run `npm run build` before commiting to make sure the build is successfull and the deployment works.
