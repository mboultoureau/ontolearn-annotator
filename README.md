# OntoLearn Annotator

OntoLearn Annotator is a free, open-source crowdsourcing platform compatible with active learning and based on a graph system.

![Preview of graph system](docs/static/img/screenshot.png)


## Features

- **ABAC security layer**: fine-grained Attribute-Based Access Control (ABAC) for all project resources and actions, allowing advanced permission management per user, role, and context.
- **Workflow engine for annotation**: a flexible workflow engine powers the annotation system, supporting custom annotation flows, branching, loops, and complex task logic.
- **Active learning compatible**: reduce the number of annotations required by introducing active learning.
- **Playground**: allow you to test your model directly via a web interface
- **User management**: control user rights on your projects
- **Extensible**: use one of the proposed interfaces for your annotations (classification, segmentation, transcription, etc.) or create your own interface
- **Easy to use**: create your annotation tasks in just a few clicks by editing the workflow definition (YAML)
- **Multilingual**: the tool is available in English, French and Japanese, and you can easily add your own language.
- **Compatible with Headwork (WIP)**: if you're already using the [Headwork](https://headwork.irisa.fr/headwork/) crowdsourcing platform, you can easily integrate your project with OntoLearn Annotator.


## Annotation System & Workflow Engine

The annotation system is powered by a modular workflow engine. You define annotation workflows by editing a YAML definition in a textarea—no visual editor or graph drawing required. The engine supports:
- Multiple state types (task, choice, branch, loop, area selection of a picture, etc.)
- Conditional logic and branching
- Loops and repeatable steps
- Custom validation and actions
- Extensible with your own state types

The workflow engine enables advanced annotation scenarios, quality control, and automation.

## Installation

Make sure you have Node.js and Docker installed on your machine. Then, clone the repository and install the dependencies:

```bash
npm install
cp .env .env.local
```

Then, fill in the `.env.local` file with your own configuration. You can now start the project:

```bash
# Start the database and mail server
docker compose -f ./docker-compose.yml -f ./docker-compose.dev.yml up -d

# Run database migrations  
dotenv -e .env.local -- npm exec prisma migrate dev

# Start the development server
npm run dev
```

### Prerequisites

This project requires an ABAC (Attribute-Based Access Control) server for the security layer. Make sure you have:
- An ABAC server running and accessible (see [ABAC Server](https://zenodo.org/records/18412324?token=eyJhbGciOiJIUzUxMiJ9.eyJpZCI6IjgwYWRiYmFjLTgwZTUtNDNmZS1hMjMzLWZhZWUxYTU0ODU3YSIsImRhdGEiOnt9LCJyYW5kb20iOiI3YzFiOTFiNjlkOWU2Yjc1MTY5OTU4YzFlMWI2N2RmZiJ9.J4-qW_ubrfn151UU3CsbwmrAmygVePr0sDYZcoUkkbnSKHqUwHH6N3bk2WXq-ZaL58Ws2fYodGJz_tnSI3IV6A) for more information)
- The ABAC server URL configured in your `.env.local` file (see `ABAC_SERVER_URL`)

The application will be available at `http://localhost:3000`.

## Author

Made by [Mathis Boultoureau](https://github.com/mboultoureau)