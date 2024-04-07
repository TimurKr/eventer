# Service Management App

This application allows you to create services, sell tickets, and manage events and contacts effectively.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development purposes.

### Prerequisites

You need to have Node.js and npm installed on your machine. If you don't have these installed, you can download them from [here](https://nodejs.org/en/download/).

### Setting Up

1. **Environment Variables**: Create a `.env` file in the root directory of the project and add the following variables:

```env
# Connecting to Supabase with supabase-js
# Get these values from your project settings on https://app.supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase>

PG_URI="postgres://postgres.<project-id>:<db-password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

Replace `<project-id>` and `<db-password>` with the actual values from your Supabase project.

2. **Running the App**: You can start the development server using the VSCode debugger or by running the following command in your terminal:

```sh
npm run dev
```

### Development Workflow

- **Database Changes**: If you make any changes to the database, run the following command to update the Supabase client and sync RxDB schemas:

  ```sh
  npm run generate:all
  ```

- **Before Pushing Changes**: Vercel builds a preview for each commit on all branches. Therefore, before committing your changes, make sure to build the project locally to ensure there are no build errors:

  ```sh
  npm run build
  ```

## Contributing

Contributions are welcome from everyone! If you're interested in contributing, create an issue before working on a pull request.
