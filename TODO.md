# TODO

Backlog for OntoLearn Annotator, as of 2026-09-01 (branch `feature/new_annotation`).

Every claim below was verified against the running stack, not read off the code. File
references use `path:line`. Start the whole thing locally with `../start-local.sh`.

Suggested order: security holes → engine data loss → auth middleware → file storage
(which overlaps security) → deployment → node editor → Headwork. Headwork sits last
because it is the only item blocked on a third party whose contract is still undefined.

---

## P0 — Security holes

### 1. `/api/v1/*` has no authentication at all

Six routes accept unauthenticated requests: `data`, `tasks`, `sources`, `statistics`,
`playground-tasks`, `data/[id]`. No `auth()` call, no API key, no `Authorization` header
check — and there is no `middleware.ts` to cover them.

Verified: an anonymous `POST /api/v1/projects/<id>/data` created a row and returned it.

These are the routes the Python clients in `examples/` call, so a session cookie is the
wrong answer — they need a machine credential (project-scoped API key or service token),
checked in the route and mapped onto an ABAC action.

### 2. `POST /api/projects/[slug]/config/[type]` has no authentication

`src/app/api/projects/[slug]/config/[type]/route.ts` — zero auth checks, and it
overwrites a project's **entire annotation workflow**. Verified by calling it with no
cookie. Needs `requireWrite(projectId, "settings")` like the tRPC routers do.

Its `validate` sibling route is fine and works (returns
`{"valid":true,"metadata":{...}}`).

### 3. Uploaded files are served publicly with no access control

Covered under [File storage](#6-real-file-storage) below — listed here because the
access-control half is a security bug, not an architecture preference.

---

## P0 — The workflow engine drops data, but not where you would expect

Two independent capture paths exist, and only one of them works everywhere:

- **What reaches the database** is built client-side from the raw events in
  `workflow-annotator.tsx:405-478`, *not* from `context.data`. `area_select`, `choice`,
  `multi_choice` and `yes_no` all produce an annotation there, loop iterations included.
- **`context.data`** — what guards (`when:`) and the final summary read — is written by
  `storeAs`, which only works for `choice`, `multi_choice` and `yes_no`.

Consequences, in order of severity:

1. **`task` states capture nothing at all.** They are absent from `context.data` (item 4)
   *and* that client-side switch has no `task` branch, so no annotation is emitted
   either. A workflow collecting form fields silently records nothing.
2. **No guard can depend on a `task` field or a selected area**, since neither reaches
   `context.data`. Guards on `choice` values do work — which is why
   `water-crystal-annotation.yaml` behaves correctly.
3. The `final` state's `summary`, and anything else reading `context.data`, is incomplete.

Reproduce with `workflows/examples/node-coverage-test.yaml`, which walks all 8 node types.

### 4. `task` fields never store their values

`ActionCompiler.compileTaskActions` builds a `store_<stateId>` action that reads
`event.data[field.id]` per field — but `StateCompiler.addStoreActionsToTransitions`
(`src/lib/workflow-engine/compilers/StateCompiler.ts:136`) returns early on
`!state.storeAs`, and a `task` state has no top-level `storeAs`: `TaskStateSchema` is
`.strict()` and does not allow one. The action is compiled and never attached. Every
task field lands as `null`.

### 5. `area_select` never stores the area *into the context*

`AreaSelectStateCompiler.compile` never calls `addStoreActionsToTransitions`, and the
`AREA_SELECTED` transition it auto-adds (`AreaSelectStateCompiler.ts:26`) carries no
`actions`. The area still reaches the database through the client-side path, so this is
not loss on save — but no guard can branch on a selected area.

Also: the `loop` state's own `storeAs`, meant to accumulate iterations, stays `null`;
individual iteration steps are still saved, tagged with their `iteration` index.

Both fixes are a few lines. Add a regression test that asserts on `context.data`, not
just on the state path: navigation is fine, only the writes are broken.

### 6. An answer given before any area selection cannot be stored at all

`groupAnnotationsByContext` in `/api/workflow/save` only opens a group when it meets an
`area` annotation, and a `choice` met before the first one is dropped with no `else`
branch. So a whole-image answer — a global classification, an overall quality rating —
never reaches the database. In `node-coverage-test.yaml` this is `pick_severity`.

This is not a one-line fix: `Annotation.areaOfInterestId` is **non-nullable** in the
Prisma schema, so an annotation that is not about a region has nowhere to live. Deciding
how to model image-level labels (a nullable area, or a whole-image AOI created
implicitly) is a schema decision, and it blocks any workflow whose first question is
about the image as a whole.

---

## Feature work

### 6. Real file storage

Today: synchronous `writeFileSync` into the Next.js `public/` directory, in three places
— `src/actions/data.ts:91`, `src/actions/projects.ts:41`,
`src/server/actions/playground.ts:24`.

Three separate problems:

- **No access control.** Anything under `public/` is served as a static asset, so every
  uploaded image is readable by URL with no session. This is the security half.
- **No horizontal scaling.** Files live on the instance's local disk; a second replica
  cannot see them.
- **Blocking I/O.** `writeFileSync` stalls the Node event loop on every upload.

Target: object storage (S3 or MinIO) behind either signed short-lived URLs or an
`/api/files/[id]` route that goes through ABAC (`data:read`). Needs a migration path for
existing `filePath` values, which are currently `/uploads/...` public paths.

### 7. Deployment

The multi-stage Dockerfile builds a Next standalone image and is broadly correct. Two
hard blockers:

- `Dockerfile` does `COPY --from=builder /app/.env.local ./.env` — this **bakes secrets
  into the image**, and the build fails outright without a `.env.local`, which is
  gitignored. The build is therefore neither reproducible nor safe to publish. Env should
  be injected at runtime.
- Base image is `node:18-alpine`; Node 18 has been end-of-life since April 2025.

Also missing: CI pipeline, container healthcheck, a migration step at deploy time, TLS
and a reverse proxy (`docker-compose.yml` maps both 80 and 443 to the same plain port
3000). And ABAC_NII is a runtime dependency — the deployment story has to cover two
services plus two databases, not one.

### 8. UX / navigation

- **An ABAC denial renders as a 404.** `fetchProjectBySlug`
  (`src/services/projects.ts:83`) returns `null` on a failed `project:read`, and the page
  calls `notFound()`. A project you are a member of but lack rights on is
  indistinguishable from one that does not exist. It should be an explicit
  "access denied" screen.
- **Scratch pages ship and are routable**: `/workflow-poc` (459 lines),
  `/workflow-demo`, `/workflow-test`. Delete or move behind a dev-only flag.

### 9. Node-based workflow editor instead of YAML

Current state of the two halves:

- The **real** editor is a YAML textarea at `/projects/{slug}/settings/annotations`, with
  working Load / Validate / Save against `/api/projects/{slug}/config/annotation_workflow`.
  The workflow is stored as a YAML string in `Configuration.settings.workflow`, keyed by
  `(projectId, type="annotation_workflow")`.
- `FlowBuilder` (`src/app/_components/task/flow-builder/flow-builder.tsx`, 450 lines,
  `@xyflow/react`) is mounted at `/projects/{slug}/settings/tasks` but is a **static
  mock**: `initialNodes` is hardcoded, there is no fetch and no save, and its node model
  (`taskNode` with typed `flow`/`image` ports) does not match the engine's schema.

Recommendation: keep YAML as the **storage** format and make the graph a bidirectional
view over it, rather than replacing the format. The Zod schema in
`src/lib/workflow-engine/schema.ts` already defines the full contract, so:

- YAML → graph is the easy direction (parse, lay out, render).
- Graph → YAML is where the work is: loops (nested `steps`), `branch` guard ordering,
  `storeAs` paths, and the two `yes_no` wiring forms (`yesTarget`/`noTarget` vs
  `transitions`).

Two engine gaps to close first, or the editor will offer nodes that do not work:

- `over:` (iterate over a collection) is accepted by `LoopStateSchema` but **not
  implemented** — `LoopStateCompiler` only handles `repeatWhile`.
- Only 4 of the 9 schema field types render in a `task` state (`text`, `email`,
  `number`, `textarea`). `select`, `slider`, `yes_no` and `area_select` fields validate
  but render as a bare label.

### 10. Headwork integration

Effectively unstarted. What exists: the `DataFileDestination.HEADWORK` and
`AuthorType.HEADWORK` enum values, a few validation schemas, and `amqplib` as a
dependency that is **never imported anywhere**.

Everything is still to be specified before any code: transport (AMQP?), task exchange
format, annotation mapping in both directions, and whether we push or Headwork pulls.

---

## P2 — Tech debt

- **Duplicated, drifting test suites**: `src/__tests__/unit/{parser,compiler}.test.ts`
  and `src/lib/workflow-engine/__tests__/{parser,compiler}.test.ts` both match the vitest
  `include` glob and test the same modules independently.
- **The committed `.env` is wrong**: it declares `postgresql://app:ChangeMe@db:5432/app`
  while the Prisma provider is `mysql`, the migrations are MySQL dialect, and compose
  publishes MariaDB on **3307**. It also defaults `ABAC_SERVER_URL` to port 4000 while
  `inheritance_service` listens on **5004**. Following the README verbatim fails at the
  migrate step.
- **`tsc --noEmit` reports 119 errors**, every one of them in a test file
  (`loop-edge-cases.test.ts` alone accounts for 49, mostly `Date` where a `string` is
  expected and a `metadata` key the context type does not declare). The count is
  identical before and after the 2026-09-01 work, so this is a standing baseline, not a
  regression — but Vitest passes only because it transpiles without typechecking, so a
  CI typecheck step would be red on day one. Several of the offending files are the
  duplicated suites above, so the two items overlap.
- `amqplib` is an unused dependency — remove it, or use it for Headwork (item 10).
- `src/lib/workflow-engine/README.md` references a `REFACTORING.md` that does not exist,
  and claims "87 tests passing" — the suite is 152 across 15 files.
- `ABAC_NII` is not a git repository. Its `opa/policy.rego` was rewritten on 2026-08-31
  from the shipped demo policy to a real `ADMIN`/`USER` role policy; the original is kept
  only as `opa/policy.demo.rego.bak`. Put that repo under version control.

---

---

## Fixed on 2026-09-01 — context for the handover

Do not re-diagnose these; they are done and verified. Listed because the reasoning is
easy to lose and two of them were caused by upstream behaviour, not by our code.

- **`middleware.ts` now exists.** The `authorized()` callback in `auth.ts` had never run —
  in NextAuth v5 it only fires from middleware — so a signed-out visitor reached the page
  and `protectedProcedure` threw an unhandled `UNAUTHORIZED` (and `/projects` returned
  500). Because middleware runs on the Edge, where Prisma and nodemailer cannot, the
  config is split: `src/server/auth.config.ts` holds the Edge-safe slice (`session`,
  `pages`, `authorized`) and `auth.ts` spreads it. Protected pages now redirect to `/`.
  The old "logged-in visitor bounces to /projects" branch was dropped, otherwise the
  landing page is unreachable once signed in.
- **Email login used to fail with `MissingCSRF` on a cold first visit.** `login/page.tsx`
  read the `authjs.csrf-token` cookie, but `/login` never sets it — only an
  `/api/auth/*` route does. The form now goes through the `signIn()` server action, like
  the OAuth buttons.
- **`verify-request` is now a real page** (`/login/verify-request`). Note
  `pages.verifyRequest` **does not work**: `@auth/core`'s `send-token.js:68` hardcodes
  the redirect. The sign-in action calls `signIn(..., { redirect: false })` and redirects
  itself.
- **Browser language detection was broken for every real browser.** The old code compared
  raw `Accept-Language` entries (`fr-FR`, `fr;q=0.9`) against `['en','fr','ja']`, so only
  a bare `fr` matched. `src/lib/accept-language.ts` now parses properly, with 9 tests.
- **The language choice did not persist.** `setUserLocale` set a session cookie, and the
  settings form used `mutate` (fire-and-forget) so the database write was never awaited —
  the UI could switch language while the account kept the old one, and the next sign-in
  silently reverted it. Cookie is now persistent (1 year); the form awaits `mutateAsync`.
- **Polygon areas rendered as "Invalid coordinates"** in the read-only history: the
  polygon tool emits `[x, y]` tuples (also what is stored in `AreaOfInterest.area`) while
  the renderer only accepted `{x, y}` objects. Four tests cover both shapes.
- **Classes were never attached for any workflow but the water-crystal one.**
  `extractClassesFromPayload` was hardcoded to that workflow's storeAs paths. A leaf
  value is now treated as a class when the project declares it as a ClassType — which
  also means a class-bearing `choice` must read `source: <class types>` rather than
  inline demo values, or it silently links nothing.
- **The landing page had no way in.** The "Get Started" button's `href` was commented out
  in favour of `href="#"` plus an onClick, and the `isLogged` prop was unused. There is
  now a Login/Projects button in the header and a real `href`.

---

## Notes for whoever picks this up

- **OPA does not watch its policy file.** It loads `policy.rego` once at startup, so
  `docker compose restart opa` is required after editing it.
- **The annotator caches ABAC decisions in-process** for `ABAC_CACHE_TTL` (3600s), so a
  policy fix does not take effect in a running dev server — restart it.
- **A stale `ABAC_SERVER_URL` looks exactly like a permission denial.** `checkPermission`
  fails closed on a fetch error, logging only `ECONNREFUSED`.
- **`branch` states are not auto-transitioning in the machine.** They only accept `NEXT`;
  the renderer sends it after a ~500ms routing message. Driving a machine in a test
  without that `NEXT` desynchronises every later event by one and produces misleading
  "stored in the wrong field" results.
- Event names the UI sends (`workflow-annotator.tsx:543` → `actor.send({type, data})`):
  `NEXT` for task/choice/multi_choice, `AREA_SELECTED` for area_select, `YES`/`NO` for
  yes_no and loop checks.
