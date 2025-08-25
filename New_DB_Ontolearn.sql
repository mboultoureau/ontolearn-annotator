--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 17.0

-- Started on 2025-06-26 11:24:42 JST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: quilele
--

CREATE SCHEMA public;
SET SCHEMA 'public';


ALTER SCHEMA public OWNER TO quilele;

--
-- TOC entry 3980 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: quilele
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 852 (class 1247 OID 33734)
-- Name: DataType; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."DataType" AS ENUM (
    'TEXT',
    'IMAGE',
    'DEEP_ZOOM_IMAGE',
    'FILE'
);


ALTER TYPE public."DataType" OWNER TO test;

CREATE TYPE public."job" AS ENUM (
    'GUEST',
    'EXPERT',
    'PHOTOGRAPH',
    'ADMIN'
);

ALTER TYPE public."job" OWNER TO test;

--
-- TOC entry 909 (class 1247 OID 33963)
-- Name: Locale; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."Locale" AS ENUM (
    'ENGLISH',
    'FRENCH',
    'JAPANESE'
);


ALTER TYPE public."Locale" OWNER TO test;

--
-- TOC entry 915 (class 1247 OID 33980)
-- Name: PlaygroundTaskStatus; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."PlaygroundTaskStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."PlaygroundTaskStatus" OWNER TO test;

--
-- TOC entry 849 (class 1247 OID 33728)
-- Name: Role; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE public."Role" OWNER TO test;

--
-- TOC entry 855 (class 1247 OID 33744)
-- Name: SourceStatus; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."SourceStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."SourceStatus" OWNER TO test;

--
-- TOC entry 858 (class 1247 OID 33754)
-- Name: SourceTypeFieldType; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."SourceTypeFieldType" AS ENUM (
    'STRING',
    'FILE'
);


ALTER TYPE public."SourceTypeFieldType" OWNER TO test;

--
-- TOC entry 921 (class 1247 OID 34009)
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."TaskStatus" OWNER TO test;

--
-- TOC entry 912 (class 1247 OID 33970)
-- Name: Theme; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."Theme" AS ENUM (
    'SYSTEM',
    'LIGHT',
    'DARK'
);


ALTER TYPE public."Theme" OWNER TO test;

--
-- TOC entry 846 (class 1247 OID 33723)
-- Name: Visibility; Type: TYPE; Schema: public; Owner: test
--

CREATE TYPE public."Visibility" AS ENUM (
    'PUBLIC',
    'PRIVATE'
);


ALTER TYPE public."Visibility" OWNER TO test;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 212 (class 1259 OID 33768)
-- Name: Account; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."Account" (
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Account" OWNER TO test;

--
-- TOC entry 215 (class 1259 OID 33789)
-- Name: Authenticator; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."Authenticator" (
    "credentialID" text NOT NULL,
    "userId" text NOT NULL,
    "providerAccountId" text NOT NULL,
    "credentialPublicKey" text NOT NULL,
    counter integer NOT NULL,
    "credentialDeviceType" text NOT NULL,
    "credentialBackedUp" boolean NOT NULL,
    transports text
);


ALTER TABLE public."Authenticator" OWNER TO test;

--
-- TOC entry 216 (class 1259 OID 33796)
-- Name: Category; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."ProjectCategory" (
    id_category text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text NOT NULL
);


ALTER TABLE public."ProjectCategory" OWNER TO test;

--
-- TOC entry 219 (class 1259 OID 33819)
-- Name: Data; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."DataFile" (
    id_data text NOT NULL,
    id_dataSource text NOT NULL,
    id_project text NOT NULL,
    name text NOT NULL,
    type public."DataType" DEFAULT 'TEXT'::public."DataType" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text,
    preview text,
    metadata jsonb,
    "filePath" text NOT NULL,
    "previewPath" text NOT NULL
);


ALTER TABLE public."DataFile" OWNER TO test;


--
-- TOC entry 227 (class 1259 OID 33989)
-- Name: PlaygroundTask; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."PlaygroundTask" (
    id_pgTask text NOT NULL,
    id_project text NOT NULL,
    id_user text NOT NULL,
    playgroundTaskStatus public."PlaygroundTaskStatus" DEFAULT 'PENDING'::public."PlaygroundTaskStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    input jsonb NOT NULL,
    output jsonb
);


ALTER TABLE public."PlaygroundTask" OWNER TO test;

--
-- TOC entry 217 (class 1259 OID 33803)
-- Name: Project; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."Project" (
    id_project text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    visibility public."Visibility" DEFAULT 'PRIVATE'::public."Visibility" NOT NULL,
    image text,
    "useHeadwork" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Project" OWNER TO test;

--
-- TOC entry 218 (class 1259 OID 33811)
-- Name: ProjectMember; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."ProjectMember" (
    id_user text NOT NULL,
    id_project text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL
);


ALTER TABLE public."ProjectMember" OWNER TO test;

--
-- TOC entry 213 (class 1259 OID 33776)
-- Name: Session; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."Session" (
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO test;

--
-- TOC entry 220 (class 1259 OID 33828)
-- Name: Source; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."DataSource" (
    id_dataSource text NOT NULL,
    id_sourceType text NOT NULL,
    id_project text NOT NULL,
    name text NOT NULL,
    sourceStatus public."SourceStatus" DEFAULT 'PENDING'::public."SourceStatus" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "statusInfo" jsonb
);


ALTER TABLE public."DataSource" OWNER TO test;

--
-- TOC entry 222 (class 1259 OID 33844)
-- Name: SourceField; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."SourceField" (
    id_sourceField text NOT NULL,
    id_dataSource text NOT NULL,
    id_sourceTypeField text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public."SourceField" OWNER TO test;

--
-- TOC entry 221 (class 1259 OID 33837)
-- Name: SourceType; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."SourceType" (
    id_sourceType text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    icon text NOT NULL
);


ALTER TABLE public."SourceType" OWNER TO test;

--
-- TOC entry 223 (class 1259 OID 33851)
-- Name: SourceTypeField; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."SourceTypeField" (
    id_sourceTypeField text NOT NULL,
    id_sourceType text NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    type public."SourceTypeFieldType" NOT NULL,
    required boolean NOT NULL
);


ALTER TABLE public."SourceTypeField" OWNER TO test;

--
-- TOC entry 226 (class 1259 OID 33949)
-- Name: Statistics; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."Statistics" (
    id_stats text NOT NULL,
    id_project text NOT NULL,
    epoch integer NOT NULL,
    loss double precision NOT NULL,
    accuracy double precision NOT NULL,
    addedAt timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Statistics" OWNER TO test;

--
-- TOC entry 228 (class 1259 OID 34017)
-- Name: Task; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."Question" (
    id_question serial NOT NULL,
    id_project text NOT NULL,
    id_data text NOT NULL,
    input jsonb NOT NULL,
    taskStatus public."TaskStatus" DEFAULT 'PENDING'::public."TaskStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    type text NOT NULL
);


ALTER TABLE public."Question" OWNER TO test;

--
-- TOC entry 211 (class 1259 OID 33759)
-- Name: User; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."User" (
    id_user text NOT NULL,
    name text,
    email text NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    image text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    locale public."Locale" DEFAULT 'ENGLISH'::public."Locale" NOT NULL,
    theme public."Theme" DEFAULT 'SYSTEM'::public."Theme" NOT NULL,
    job text NOT NULL
);


ALTER TABLE public."User" OWNER TO test;

--
-- TOC entry 214 (class 1259 OID 33782)
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO test;

--
-- TOC entry 225 (class 1259 OID 33865)
-- Name: _CategoryToProject; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."_CategoryToProject" (
    id_project text NOT NULL,
    id_category text NOT NULL
);


ALTER TABLE public."_CategoryToProject" OWNER TO test;

-- Assigned
create table public."Assigned" (
    id_user text NOT NULL,
    id_question text NOT NULL,
    id_aoi text NOT NULL,
    opinion text NOT NULL,
    output jsonb
);

ALTER TABLE public."Assigned" OWNER TO test;

-- Area of Interest
create table public."AreaOfInterest" (
    id_aoi serial not null,
    id_user text not null,
    id_classType text,
    id_data text,
    area text NOT NULL,
    createdAt timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE public."AreaOfInterest" OWNER TO test;

-- Class
create table public."ClassType" (
    id_classType text not null,
    id_project text not null,
    name text not null
);

ALTER TABLE public."ClassType" OWNER TO test;

-- Non annotated
create table public."NonAnnotated" (
    id_nonannotated text not null
);

ALTER TABLE public."NonAnnotated" OWNER TO test;

-- Annotated
create table public."Annotated" (
    id_annotated text not null
);

ALTER TABLE public."Annotated" OWNER TO test;

-- Classified
create table public."Classified" (
    id_classType text not null,
    id_aoi integer not null,
    id_data text not null,
    addedAt timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt timestamp(3) without time zone NOT NULL,
    quality text NOT NULL
);

ALTER TABLE public."Classified" OWNER TO test;

--
-- TOC entry 210 (class 1259 OID 33713)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public."_prisma_migrations" (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."_prisma_migrations" OWNER TO test;

--
-- TOC entry 3958 (class 0 OID 33768)
-- Dependencies: 212
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."Account" ("userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3961 (class 0 OID 33789)
-- Dependencies: 215
-- Data for Name: Authenticator; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."Authenticator" ("credentialID", "userId", "providerAccountId", "credentialPublicKey", counter, "credentialDeviceType", "credentialBackedUp", transports) FROM stdin;
\.


--
-- TOC entry 3962 (class 0 OID 33796)
-- Dependencies: 216
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."ProjectCategory" (id_category, name, slug, description, icon) FROM stdin;
cmbpul2l70001s8r9bwbn58se	Environment	environment	Projects that help protect the environment.	leaf
\.


--
-- TOC entry 3965 (class 0 OID 33819)
-- Dependencies: 219
-- Data for Name: Data; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."DataFile" (id_data, id_dataSource, id_project, name, type, "uploadedAt", content, preview, metadata, "filePath", "previewPath") FROM stdin;
\.


--
-- TOC entry 3973 (class 0 OID 33989)
-- Dependencies: 227
-- Data for Name: PlaygroundTask; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."PlaygroundTask" (id_pgTask, id_project, id_user, playgroundTaskStatus, "createdAt", "updatedAt", input, output) FROM stdin;
\.


--
-- TOC entry 3963 (class 0 OID 33803)
-- Dependencies: 217
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."Project" (id_project, name, slug, description, visibility, image, "useHeadwork") FROM stdin;
cmbpul2l90002s8r9emgg0779	Deep Learning-Based Water Crystal Classification	deep-learning-based-water-crystal-classification	Deep learning-based water crystal classification.	PRIVATE	\N	f
\.


--
-- TOC entry 3964 (class 0 OID 33811)
-- Dependencies: 218
-- Data for Name: ProjectMember; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."ProjectMember" (id_user, id_project, role) FROM stdin;
\.


--
-- TOC entry 3959 (class 0 OID 33776)
-- Dependencies: 213
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."Session" ("sessionToken", "userId", expires, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3966 (class 0 OID 33828)
-- Dependencies: 220
-- Data for Name: Source; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."DataSource" (id_dataSource, id_sourceType, id_project, name, sourceStatus, "uploadedAt", "statusInfo") FROM stdin;
\.


--
-- TOC entry 3968 (class 0 OID 33844)
-- Dependencies: 222
-- Data for Name: SourceField; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."SourceField" (id_sourceField, id_dataSource, id_sourceTypeField, value) FROM stdin;
\.


--
-- TOC entry 3967 (class 0 OID 33837)
-- Dependencies: 221
-- Data for Name: SourceType; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."SourceType" (id_sourceType, name, label, icon) FROM stdin;
cmbpwf9jd0005s8azug1xy6un	file	file	croissant
\.


--
-- TOC entry 3969 (class 0 OID 33851)
-- Dependencies: 223
-- Data for Name: SourceTypeField; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."SourceTypeField" (id_sourceTypeField, id_sourceType, name, label, type, required) FROM stdin;
\.


--
-- TOC entry 3972 (class 0 OID 33949)
-- Dependencies: 226
-- Data for Name: Statistics; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."Statistics" (id_stats, id_project, epoch, loss, accuracy, addedAt) FROM stdin;
\.


--
-- TOC entry 3974 (class 0 OID 34017)
-- Dependencies: 228
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."Question" (id_question, id_project, id_data, input, TaskStatus, "createdAt", "updatedAt", type) FROM stdin;
\.


--
-- TOC entry 3957 (class 0 OID 33759)
-- Dependencies: 211
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."User" (id_user, name, email, "emailVerified", image, "createdAt", "updatedAt", locale, theme, job) FROM stdin;
\.


--
-- TOC entry 3960 (class 0 OID 33782)
-- Dependencies: 214
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- TOC entry 3971 (class 0 OID 33865)
-- Dependencies: 225
-- Data for Name: _CategoryToProject; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public."_CategoryToProject" (id_category, id_project) FROM stdin;
cmbpul2l70001s8r9bwbn58se	cmbpul2l90002s8r9emgg0779
\.


--
-- TOC entry 3956 (class 0 OID 33713)
-- Dependencies: 210
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.

-- Alter Table Primary keys

ALTER TABLE ONLY public."Assigned"
    ADD CONSTRAINT "Assigned_pkey" PRIMARY KEY (id_user, id_question, id_aoi);


ALTER TABLE ONLY public."ClassType"
    ADD CONSTRAINT "ClassType_pkey" PRIMARY KEY (id_classType);


ALTER TABLE ONLY public."Classified"
    ADD CONSTRAINT "Classified_pkey" PRIMARY KEY (id_classType, id_aoi, id_data);


ALTER TABLE ONLY public."Annotated"
    ADD CONSTRAINT "Annotated_pkey" PRIMARY KEY (id_annotated);


ALTER TABLE ONLY public."NonAnnotated"
    ADD CONSTRAINT "NonAnnotated_pkey" PRIMARY KEY (id_nonannotated);


ALTER TABLE ONLY public."AreaOfInterest"
    ADD CONSTRAINT "Aoi_pkey" PRIMARY KEY (id_aoi);


ALTER TABLE ONLY public."_CategoryToProject"
    ADD CONSTRAINT "CatProject_pkey" PRIMARY KEY (id_project, id_category);



--
-- TOC entry 3762 (class 2606 OID 33775)
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (provider, "providerAccountId");


--
-- TOC entry 3768 (class 2606 OID 33795)
-- Name: Authenticator Authenticator_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Authenticator"
    ADD CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId", "credentialID");


--
-- TOC entry 3770 (class 2606 OID 33802)
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."ProjectCategory"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id_category);


--
-- TOC entry 3778 (class 2606 OID 33827)
-- Name: Data Data_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."DataFile"
    ADD CONSTRAINT "Data_pkey" PRIMARY KEY (id_data);


--
-- TOC entry 3796 (class 2606 OID 33997)
-- Name: PlaygroundTask PlaygroundTask_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."PlaygroundTask"
    ADD CONSTRAINT "PlaygroundTask_pkey" PRIMARY KEY (id_pgTask);


--
-- TOC entry 3776 (class 2606 OID 33818)
-- Name: ProjectMember ProjectMember_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_pkey" PRIMARY KEY (id_user, id_project);


--
-- TOC entry 3773 (class 2606 OID 33810)
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id_project);


--
-- TOC entry 3784 (class 2606 OID 33850)
-- Name: SourceField SourceField_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."SourceField"
    ADD CONSTRAINT "SourceField_pkey" PRIMARY KEY (id_sourceField);


--
-- TOC entry 3786 (class 2606 OID 33857)
-- Name: SourceTypeField SourceTypeField_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."SourceTypeField"
    ADD CONSTRAINT "SourceTypeField_pkey" PRIMARY KEY (id_sourceTypeField);


--
-- TOC entry 3782 (class 2606 OID 33843)
-- Name: SourceType SourceType_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."SourceType"
    ADD CONSTRAINT "SourceType_pkey" PRIMARY KEY (id_sourceType);


--
-- TOC entry 3780 (class 2606 OID 33836)
-- Name: Source Source_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."DataSource"
    ADD CONSTRAINT "Source_pkey" PRIMARY KEY (id_dataSource);


--
-- TOC entry 3794 (class 2606 OID 33955)
-- Name: Statistics Statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Statistics"
    ADD CONSTRAINT "Statistics_pkey" PRIMARY KEY (id_stats);


--
-- TOC entry 3798 (class 2606 OID 34025)
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id_question);


--
-- TOC entry 3760 (class 2606 OID 33767)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id_user);


--
-- TOC entry 3765 (class 2606 OID 33788)
-- Name: VerificationToken VerificationToken_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."VerificationToken"
    ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY (identifier, token);


--
-- TOC entry 3757 (class 2606 OID 33721)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3766 (class 1259 OID 33872)
-- Name: Authenticator_credentialID_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON public."Authenticator" USING btree ("credentialID");


--
-- TOC entry 3771 (class 1259 OID 33873)
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."ProjectCategory" USING btree (slug);


--
-- TOC entry 3787 (class 1259 OID 33875)
-- Name: Image_filePath_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "DataFile_filePath_key" ON public."DataFile" USING btree ("filePath");


--
-- TOC entry 3790 (class 1259 OID 33876)
-- Name: Image_previewPath_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "DataFile_previewPath_key" ON public."DataFile" USING btree ("previewPath");


--
-- TOC entry 3774 (class 1259 OID 33874)
-- Name: Project_slug_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "Project_slug_key" ON public."Project" USING btree (slug);


--
-- TOC entry 3763 (class 1259 OID 33871)
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- TOC entry 3758 (class 1259 OID 33870)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 3791 (class 1259 OID 33877)
-- Name: _CategoryToProject_AB_unique; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX "_CategoryToProject_AB_unique" ON public."_CategoryToProject" USING btree (id_category, id_project);


--
-- TOC entry 3792 (class 1259 OID 33878)
-- Name: _CategoryToProject_B_index; Type: INDEX; Schema: public; Owner: test
--

CREATE INDEX "_CategoryToProject_B_index" ON public."_CategoryToProject" USING btree (id_project);


-- ALTER TABLE FOREIGN KEY

ALTER TABLE ONLY public."AreaOfInterest"
    ADD CONSTRAINT "Aoi_userId_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."AreaOfInterest"
    ADD CONSTRAINT "Aoi_user_classType_fkey" FOREIGN KEY (id_classType, id_aoi, id_data) REFERENCES public."Classified"(id_classType, id_aoi, id_data) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."ClassType"
    ADD CONSTRAINT "ClassType_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."DataFile"
    ADD CONSTRAINT "Datafile_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Classified"
    ADD CONSTRAINT "Classified_ClassId_fkey" FOREIGN KEY (id_classType) REFERENCES public."ClassType"(id_classType) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Classified"
    ADD CONSTRAINT "Classified_data_fkey" FOREIGN KEY (id_data) REFERENCES public."DataFile"(id_data) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Classified"
    ADD CONSTRAINT "Classified_aoi_fkey" FOREIGN KEY (id_aoi) REFERENCES public."AreaOfInterest"(id_aoi) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Annotated"
    ADD CONSTRAINT "Annotated_data_fkey" FOREIGN KEY (id_annotated) REFERENCES public."DataFile"(id_data) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."NonAnnotated"
    ADD CONSTRAINT "NonAnnotated_data_fkey" FOREIGN KEY (id_nonannotated) REFERENCES public."DataFile"(id_data) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_data_fkey" FOREIGN KEY (id_data) REFERENCES public."DataFile"(id_data) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMem_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMem_userId_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- TOC entry 3799 (class 2606 OID 33879)
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3801 (class 2606 OID 33889)
-- Name: Authenticator Authenticator_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Authenticator"
    ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3804 (class 2606 OID 33904)
-- Name: Data Data_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."DataFile"
    ADD CONSTRAINT "Data_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3814 (class 2606 OID 34003)
-- Name: PlaygroundTask PlaygroundTask_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."PlaygroundTask"
    ADD CONSTRAINT "PlaygroundTask_createdById_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3815 (class 2606 OID 33998)
-- Name: PlaygroundTask PlaygroundTask_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."PlaygroundTask"
    ADD CONSTRAINT "PlaygroundTask_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3802 (class 2606 OID 33899)
-- Name: ProjectMember ProjectMember_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3803 (class 2606 OID 33894)
-- Name: ProjectMember ProjectMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY (id_user) REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3800 (class 2606 OID 33884)
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id_user) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3808 (class 2606 OID 33929)
-- Name: SourceField SourceField_fieldId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."SourceField"
    ADD CONSTRAINT "SourceField_fieldId_fkey" FOREIGN KEY (id_sourceTypeField) REFERENCES public."SourceTypeField"(id_sourceTypeField) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3809 (class 2606 OID 33924)
-- Name: SourceField SourceField_sourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."SourceField"
    ADD CONSTRAINT "SourceField_sourceId_fkey" FOREIGN KEY (id_dataSource) REFERENCES public."DataSource"(id_dataSource) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3810 (class 2606 OID 33934)
-- Name: SourceTypeField SourceTypeField_sourceTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."SourceTypeField"
    ADD CONSTRAINT "SourceTypeField_sourceTypeId_fkey" FOREIGN KEY (id_sourceType) REFERENCES public."SourceType"(id_sourceType) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3805 (class 2606 OID 33914)
-- Name: Source Source_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."DataSource"
    ADD CONSTRAINT "Source_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3806 (class 2606 OID 33909)
-- Name: Source Source_sourceTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."DataSource"
    ADD CONSTRAINT "Source_sourceTypeId_fkey" FOREIGN KEY (id_sourceType) REFERENCES public."SourceType"(id_sourceType) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3813 (class 2606 OID 33956)
-- Name: Statistics Statistics_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Statistics"
    ADD CONSTRAINT "Statistics_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3816 (class 2606 OID 34026)
-- Name: Task Task_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_projectId_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3811 (class 2606 OID 33939)
-- Name: _CategoryToProject _CategoryToProject_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."_CategoryToProject"
    ADD CONSTRAINT "_CategoryToProject_User_fkey" FOREIGN KEY (id_category) REFERENCES public."ProjectCategory"(id_category) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3812 (class 2606 OID 33944)
-- Name: _CategoryToProject _CategoryToProject_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public."_CategoryToProject"
    ADD CONSTRAINT "_CategoryToProject_Project_fkey" FOREIGN KEY (id_project) REFERENCES public."Project"(id_project) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3981 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: quilele
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO test;


-- Completed on 2025-06-26 11:24:42 JST

--
-- PostgreSQL database dump complete
--

