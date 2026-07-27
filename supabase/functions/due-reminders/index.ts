// Optional daily email reminders for AfricaGo Launch Control.
// Required secrets: RESEND_API_KEY, REMINDER_FROM_EMAIL, CRON_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendKey = Deno.env.get('RESEND_API_KEY')!
const fromEmail = Deno.env.get('REMINDER_FROM_EMAIL') || 'AfricaGo <reminders@example.com>'
const cronSecret = Deno.env.get('CRON_SECRET')!

function harareDate(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Harare', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date)
}

Deno.serve(async (req) => {
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRole)
  const today = harareDate(0)
  const tomorrow = harareDate(1)

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id,user_id,role')
  if (membershipError) return Response.json({ error: membershipError.message }, { status: 500 })

  const userIds = [...new Set((memberships || []).map(m => m.user_id))]
  const workspaceIds = [...new Set((memberships || []).map(m => m.workspace_id))]
  const [{ data: profiles }, { data: workspaces }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,email').in('id', userIds),
    supabase.from('workspaces').select('id,name').in('id', workspaceIds)
  ])
  const profileMap = new Map((profiles || []).map(p => [p.id, p]))
  const workspaceMap = new Map((workspaces || []).map(w => [w.id, w]))

  let sent = 0
  for (const membership of memberships || []) {
    const profile = profileMap.get(membership.user_id)
    const workspace = workspaceMap.get(membership.workspace_id)
    if (!profile?.email) continue

    const { data: prefs } = await supabase
      .from('notification_preferences').select('*').eq('user_id', membership.user_id).maybeSingle()
    if (prefs && !prefs.email_enabled) continue

    const { data: already } = await supabase.from('notification_deliveries')
      .select('id').eq('user_id', membership.user_id).eq('workspace_id', membership.workspace_id)
      .eq('delivery_date', today).eq('kind', 'daily-digest').maybeSingle()
    if (already) continue

    const { data: tasks } = await supabase.from('tasks').select('title,status,assignee,due_date,priority')
      .eq('workspace_id', membership.workspace_id).neq('status', 'Done').lte('due_date', tomorrow).order('due_date')

    const relevant = (tasks || []).filter((task) => {
      if (!task.due_date) return false
      if (task.assignee !== 'Unassigned' && task.assignee !== profile.full_name) return false
      if (task.due_date < today) return prefs?.overdue !== false
      if (task.due_date === today) return prefs?.due_today !== false
      return prefs?.due_tomorrow !== false
    })
    if (!relevant.length) continue

    const items = relevant.map(task => `<li><strong>${task.title}</strong> — ${task.due_date < today ? 'overdue' : task.due_date === today ? 'due today' : 'due tomorrow'} · ${task.priority}</li>`).join('')
    const subject = `AfricaGo: ${relevant.length} task${relevant.length === 1 ? '' : 's'} need attention`
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: fromEmail,
        to: [profile.email],
        subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:620px"><h2>${workspace?.name || 'AfricaGo'} Launch Control</h2><p>Hello ${profile.full_name || 'founder'},</p><ul>${items}</ul><p>Open your shared tracker to update the team.</p></div>`
      })
    })
    if (!response.ok) continue

    await supabase.from('notification_deliveries').insert({
      user_id: membership.user_id,
      workspace_id: membership.workspace_id,
      delivery_date: today,
      kind: 'daily-digest'
    })
    sent++
  }

  return Response.json({ sent, date: today })
})
