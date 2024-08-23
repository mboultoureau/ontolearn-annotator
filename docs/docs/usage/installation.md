---
sidebar_position: 1
---

# Installation

OntoLearn Annotator offers several ways to install the project. The simplest and recommended option is installation using Docker.

## Docker

To install OntoLearn Annotator, you need [Docker](https://docs.docker.com/engine/install/), [Docker Compose](https://docs.docker.com/compose/install/) and [Git](https://git-scm.com/) installed on your machine.

```bash	
git clone --depth 1 https://github.com/mboultoureau/ontolearn-annotator
cd ontolearn-annotator
cp .env .env.local
```

Then, you need to fill the `.env.local` file with your own configuration.

```yaml
# You create a GitHub OAuth application by following the instructions at https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
GITHUB_CLIENT_ID=CLIENT_ID
GITHUB_CLIENT_SECRET=CLIENT_SECRET

# Your application URL
NEXTAUTH_URL="http://localhost"

# Your database URL
DATABASE_URL="postgresql://app:ChangeMe@db:5432/app?schema=public"

# You can generate a secret with the following command: npx auth secret
AUTH_SECRET="CHANGE_ME"

# Your email server configuration
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```

You can now start the project:

```bash
docker compose up -d
```

## Manual Installation

If you prefer to install the project manually, you can follow the following steps.

Assure you have [Node.js](https://nodejs.org/) installed. Install [PostgreSQL](https://www.postgresql.org/) and create a database for the project. You can also use [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) to run the database (`docker compose -f docker-compose.dev.yml up -d`).

Then, clone the repository:

```bash
git clone --depth 1 https://github.com/mboultoureau/ontolearn-annotator
cp .env .env.local
```

You need to fill the `.env.local` file with your own configuration.

```yaml
# You create a GitHub OAuth application by following the instructions at https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
GITHUB_CLIENT_ID=CLIENT_ID
GITHUB_CLIENT_SECRET=CLIENT_SECRET

# Your application URL
NEXTAUTH_URL="http://localhost"

# Your database URL
DATABASE_URL="postgresql://app:ChangeMe@db:5432/app?schema=public"

# You can generate a secret with the following command: npx auth secret
AUTH_SECRET="CHANGE_ME"

# Your email server configuration
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```

You can now start the project:

```bash
npm install
dotenv -e .env.local -- npm exec prisma migrate dev
npm run dev
```