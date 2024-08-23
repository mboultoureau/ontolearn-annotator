---
sidebar_position: 1
---

# Getting Started

Let's discover **OntoLearn Annotator in less than 15 minutes**.

## Installation

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

See the [installation guide](/docs/usage/installation) for more installation options.

## Create your first project

Once the project is started, you can access the interface at [http://localhost](http://localhost). You can 