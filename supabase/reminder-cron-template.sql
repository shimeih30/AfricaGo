-- OPTIONAL: Schedule the due-reminders Edge Function every day at 06:00 UTC
-- (08:00 in Zimbabwe). Replace the three placeholder values.
-- First deploy the Edge Function and set RESEND_API_KEY, REMINDER_FROM_EMAIL and CRON_SECRET.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'africago_project_url');
select vault.create_secret('YOUR_PUBLISHABLE_KEY', 'africago_publishable_key');
select vault.create_secret('THE_SAME_LONG_CRON_SECRET_SET_ON_THE_FUNCTION', 'africago_cron_secret');

select cron.schedule(
  'africago-daily-due-reminders',
  '0 6 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'africago_project_url') || '/functions/v1/due-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'africago_publishable_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'africago_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
