# AfricaGo Launch Control Cloud

This version keeps the polished tracker interface but moves the permanent source of truth to Supabase. Each co-founder signs in separately and joins the same AfricaGo workspace.

## What is already built

- Individual email/password accounts
- One shared AfricaGo workspace
- Private founder join code
- Row Level Security so only workspace members can read or edit its data
- Real-time task and settings updates
- Local cached copy for fast startup
- IndexedDB queue for changes made while temporarily offline
- Automatic queue flush after reconnection
- Existing local tracker migration when the shared workspace is empty
- Task activity history showing who changed what
- Cloud-safe reset: clearing the device cache does not delete the shared database
- Optional daily email reminder function

## One-time activation

### 1. Create a Supabase project

Create one project under a company-controlled account. Give at least two founders recovery access to that Supabase account.

### 2. Create the database

Open **Supabase Dashboard → SQL Editor**, paste the complete contents of:

`supabase/setup.sql`

Run it once. It creates the tables, functions, audit trail, workspace join functions and security policies.

### 3. Configure authentication

In Supabase Authentication settings:

- Enable email/password authentication.
- Set the Site URL to the final HTTPS address where the tracker will be hosted.
- Add the same address to permitted redirect URLs.
- Keep email confirmation enabled for stronger security, or temporarily disable it only during controlled testing.

### 4. Generate `config.js`

Open `setup.html`, paste:

- the Supabase Project URL;
- the **publishable key** shown in Project Settings → API.

Download the generated `config.js` and replace the placeholder `config.js` in this folder.

Never put the secret key or service-role key in the browser application.

### 5. Host the folder over HTTPS

Upload the complete folder to any HTTPS static host. The application does not need a conventional web server or Node backend.

The included local-server scripts remain useful for testing, but co-founder syncing requires each device to reach both the hosted app and Supabase.

### 6. Create and join the workspace

1. The first founder creates an account and chooses **Create shared workspace**.
2. If the browser contains the old local tracker, the app offers to upload those tasks automatically.
3. In **Settings → Shared workspace**, copy the founder join code.
4. The other two founders create their own accounts, select **Join workspace**, and enter that code.

Do not share the code publicly. An owner can rotate it later through the supplied database function if it is exposed.

## What happens after browser cleanup

Clearing browser storage can remove the login session and cached offline copy, but it cannot delete the Supabase data. The founder signs in again and the app downloads the latest shared tasks.

A change made while fully offline is queued locally. It should be allowed to reconnect and sync before a cleanup utility removes all website data; no browser app can upload a change after its unsynced local queue has already been deleted.

## Existing data migration

Automatic migration works when the cloud version is opened under the same browser origin that contains `africagoTrackerV1` local data.

When the old tracker and new hosted tracker use different addresses, perform one final export from the old version and import it into the cloud version. This is a one-time migration, not an ongoing backup process.

## Optional email reminders

The app already flags overdue and upcoming dates and can use browser notifications while open. To send reliable email reminders when it is closed:

1. Deploy `supabase/functions/due-reminders/index.ts` as a Supabase Edge Function.
2. Set the secrets `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, and `CRON_SECRET`.
3. Verify the sender domain with the email provider.
4. Adapt and run `supabase/reminder-cron-template.sql`.

The template schedules the digest for 08:00 Zimbabwe time.

## Security decisions

- The browser uses only the publishable key.
- The database enforces workspace membership through Row Level Security.
- Service-role credentials are confined to the optional Edge Function environment.
- Each founder has an individual account; do not use one shared password.
- The join code is an onboarding convenience, not a public invitation link.

## Files

- `index.html` — tracker application
- `app.js` — interface and task logic
- `cloud.js` — authentication, shared workspace, real-time sync and offline queue
- `config.js` — project URL and publishable browser key
- `app.css` — responsive 2026 interface
- `setup.html` — one-time configuration generator
- `supabase/setup.sql` — database and security setup
- `supabase/functions/due-reminders/index.ts` — optional reminder function
- `supabase/reminder-cron-template.sql` — optional daily schedule
