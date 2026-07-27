(() => {
  'use strict';

  const QUEUE_DB = 'africago-cloud-queue-v1';
  const QUEUE_STORE = 'operations';
  const WORKSPACE_CACHE = 'africagoCloudWorkspace';
  const CONFIG = window.AFRICAGO_CONFIG || {};

  let client = null;
  let session = null;
  let workspace = null;
  let channel = null;
  let callbacks = {};
  let flushing = false;

  function isConfigured() {
    return Boolean(
      CONFIG.supabaseUrl &&
      CONFIG.supabasePublishableKey &&
      !CONFIG.supabaseUrl.includes('YOUR_SUPABASE') &&
      !CONFIG.supabasePublishableKey.includes('YOUR_SUPABASE')
    );
  }

  function ensureSupabaseLibrary() {
    if (window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-supabase-client]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Could not load the Supabase client library.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.supabaseClient = 'true';
      const timer = setTimeout(() => reject(new Error('Supabase connection timed out. Check your internet connection.')), 12000);
      script.onload = () => { clearTimeout(timer); window.supabase?.createClient ? resolve() : reject(new Error('Supabase client did not initialise.')); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Could not load the Supabase client library.')); };
      document.head.appendChild(script);
    });
  }

  function notifyStatus(type, message) {
    callbacks.onStatus?.({ type, message });
  }

  async function init(nextCallbacks = {}) {
    callbacks = nextCallbacks;
    if (!isConfigured()) return { configured: false, session: null };
    await ensureSupabaseLibrary();

    client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: { params: { eventsPerSecond: 10 } }
    });

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;

    client.auth.onAuthStateChange((event, nextSession) => {
      session = nextSession;
      if (event === 'SIGNED_OUT') {
        workspace = null;
        unsubscribe();
      }
      callbacks.onAuthChange?.({ event, session: nextSession });
    });

    window.addEventListener('online', () => {
      notifyStatus('saving', 'Connection restored. Syncing queued changes…');
      flushQueue().catch(() => {});
    });
    window.addEventListener('offline', () => notifyStatus('offline', 'Offline — changes will sync later'));

    return { configured: true, session };
  }

  async function signUp({ fullName, email, password }) {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    session = data.session;
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    session = data.session;
    return data;
  }

  async function signOut() {
    unsubscribe();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    session = null;
    workspace = null;
    localStorage.removeItem(WORKSPACE_CACHE);
  }

  function getSession() {
    return session;
  }

  function getUser() {
    return session?.user || null;
  }

  async function getCurrentWorkspace() {
    if (!session?.user) return null;
    try {
      const { data: membership, error: membershipError } = await client
        .from('workspace_members')
        .select('workspace_id, role, joined_at')
        .eq('user_id', session.user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) {
        localStorage.removeItem(WORKSPACE_CACHE);
        return null;
      }
      const { data: workspaceData, error: workspaceError } = await client
        .from('workspaces')
        .select('id, name, join_code, created_by, created_at')
        .eq('id', membership.workspace_id)
        .single();
      if (workspaceError) throw workspaceError;
      workspace = { ...workspaceData, role: membership.role };
      localStorage.setItem(WORKSPACE_CACHE, JSON.stringify(workspace));
      return workspace;
    } catch (error) {
      const cached = readCachedWorkspace();
      if (cached) {
        workspace = cached;
        notifyStatus('offline', 'Using the cached workspace while offline');
        return cached;
      }
      throw error;
    }
  }

  function readCachedWorkspace() {
    try {
      const value = localStorage.getItem(WORKSPACE_CACHE);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async function createWorkspace(name) {
    const { data, error } = await client.rpc('create_workspace', { p_name: name.trim() || 'AfricaGo' });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.workspace_id) throw new Error('Workspace creation returned no workspace ID.');
    workspace = { id: row.workspace_id, name: row.workspace_name || name, join_code: row.join_code, role: 'owner' };
    localStorage.setItem(WORKSPACE_CACHE, JSON.stringify(workspace));
    return workspace;
  }

  async function joinWorkspace(code) {
    const { data, error } = await client.rpc('join_workspace', { p_code: code.trim().toUpperCase() });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.workspace_id) throw new Error('That join code was not accepted.');
    workspace = { id: row.workspace_id, name: row.workspace_name, join_code: row.join_code, role: row.member_role || 'member' };
    localStorage.setItem(WORKSPACE_CACHE, JSON.stringify(workspace));
    return workspace;
  }

  function useWorkspace(nextWorkspace) {
    workspace = nextWorkspace;
    if (workspace) localStorage.setItem(WORKSPACE_CACHE, JSON.stringify(workspace));
  }

  async function loadWorkspaceState() {
    if (!workspace?.id) throw new Error('No workspace is selected.');
    notifyStatus('saving', 'Loading shared workspace…');

    const [settingsResult, tasksResult, members, activity] = await Promise.all([
      client.from('workspace_settings').select('*').eq('workspace_id', workspace.id).maybeSingle(),
      client.from('tasks').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: true }),
      loadMembers(),
      loadActivity()
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (tasksResult.error) throw tasksResult.error;

    notifyStatus('synced', 'All changes saved to cloud');
    return {
      workspace,
      settings: settingsResult.data ? mapSettings(settingsResult.data) : null,
      tasks: (tasksResult.data || []).map(mapTaskFromRow),
      members,
      activity
    };
  }

  async function loadMembers() {
    if (!workspace?.id) return [];
    const { data: memberships, error } = await client
      .from('workspace_members')
      .select('user_id, role, joined_at')
      .eq('workspace_id', workspace.id)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    const ids = (memberships || []).map(item => item.user_id);
    let profileMap = new Map();
    if (ids.length) {
      const { data: profiles, error: profileError } = await client
        .from('profiles')
        .select('id, full_name, email')
        .in('id', ids);
      if (profileError) throw profileError;
      profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));
    }
    return (memberships || []).map(item => ({
      ...item,
      fullName: profileMap.get(item.user_id)?.full_name || 'Founder',
      email: profileMap.get(item.user_id)?.email || ''
    }));
  }

  async function loadActivity() {
    if (!workspace?.id) return [];
    const { data, error } = await client
      .from('activity_log')
      .select('id, actor_id, action, task_id, details, created_at')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    const actorIds = [...new Set((data || []).map(item => item.actor_id).filter(Boolean))];
    let profileMap = new Map();
    if (actorIds.length) {
      const { data: profiles } = await client.from('profiles').select('id, full_name').in('id', actorIds);
      profileMap = new Map((profiles || []).map(profile => [profile.id, profile.full_name]));
    }
    return (data || []).map(item => ({
      ...item,
      actorName: profileMap.get(item.actor_id) || 'AfricaGo member'
    }));
  }

  async function refreshMeta() {
    return { members: await loadMembers(), activity: await loadActivity() };
  }

  function mapSettings(row) {
    return {
      projectStartDate: row.project_start_date || '',
      people: Array.isArray(row.people) ? row.people : [],
      projectName: row.project_name || workspace?.name || 'AfricaGo Launch',
      updatedAt: row.updated_at
    };
  }

  function mapTaskFromRow(row) {
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      assignee: row.assignee || 'Unassigned',
      dueDate: row.due_date || '',
      priority: row.priority || 'Medium',
      category: row.category || 'General',
      milestone: row.milestone || 'Ongoing',
      notes: row.notes || '',
      relativeDay: row.relative_day,
      seeded: Boolean(row.seeded),
      createdAt: row.created_at,
      updatedAt: row.client_updated_at || row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      updatedByName: row.updated_by_name || '',
      completedAt: row.completed_at
    };
  }

  function mapTaskToRow(task) {
    return {
      id: task.id,
      workspace_id: workspace.id,
      title: task.title,
      status: task.status,
      assignee: task.assignee || 'Unassigned',
      due_date: task.dueDate || null,
      priority: task.priority || 'Medium',
      category: task.category || 'General',
      milestone: task.milestone || 'Ongoing',
      notes: task.notes || '',
      relative_day: task.relativeDay ?? null,
      seeded: Boolean(task.seeded),
      created_at: task.createdAt || new Date().toISOString(),
      client_updated_at: task.updatedAt || new Date().toISOString(),
      completed_at: task.completedAt || null,
      created_by: task.createdBy || session?.user?.id || null
    };
  }

  async function saveTask(task) {
    return runOrQueue({ key: `task:${task.id}`, type: 'upsert_task', payload: mapTaskToRow(task), createdAt: Date.now() });
  }

  async function deleteTask(id) {
    return runOrQueue({ key: `task:${id}`, type: 'delete_task', payload: { id, workspaceId: workspace.id }, createdAt: Date.now() });
  }

  async function saveSettings(state) {
    return runOrQueue({
      key: 'workspace-settings',
      type: 'save_settings',
      payload: {
        workspace_id: workspace.id,
        project_start_date: state.projectStartDate || null,
        people: state.people || [],
        project_name: state.projectName || workspace.name || 'AfricaGo Launch'
      },
      createdAt: Date.now()
    });
  }

  async function saveAll(state) {
    await saveSettings(state);
    await Promise.all((state.tasks || []).map(task => saveTask(task)));
  }

  async function replaceState(state) {
    return runOrQueue({
      key: 'replace-state',
      type: 'replace_state',
      payload: {
        settings: {
          workspace_id: workspace.id,
          project_start_date: state.projectStartDate || null,
          people: state.people || [],
          project_name: state.projectName || workspace.name || 'AfricaGo Launch'
        },
        tasks: (state.tasks || []).map(mapTaskToRow)
      },
      createdAt: Date.now()
    });
  }

  async function runOrQueue(operation) {
    if (!workspace?.id) return;
    if (!navigator.onLine) {
      await putOperation(operation);
      notifyStatus('offline', 'Offline — change queued on this device');
      return { queued: true };
    }
    notifyStatus('saving', 'Saving…');
    try {
      await executeOperation(operation);
      await deleteOperation(operation.key);
      notifyStatus('synced', 'All changes saved to cloud');
      return { queued: false };
    } catch (error) {
      await putOperation(operation);
      notifyStatus('queued', `Change queued: ${error.message}`);
      return { queued: true, error };
    }
  }

  async function executeOperation(operation) {
    switch (operation.type) {
      case 'upsert_task': {
        const { error } = await client.from('tasks').upsert(operation.payload, { onConflict: 'id' });
        if (error) throw error;
        break;
      }
      case 'delete_task': {
        const { error } = await client.from('tasks').delete().eq('workspace_id', operation.payload.workspaceId).eq('id', operation.payload.id);
        if (error) throw error;
        break;
      }
      case 'save_settings': {
        const { error } = await client.from('workspace_settings').upsert(operation.payload, { onConflict: 'workspace_id' });
        if (error) throw error;
        break;
      }
      case 'replace_state': {
        const { settings, tasks } = operation.payload;
        const { error: settingsError } = await client.from('workspace_settings').upsert(settings, { onConflict: 'workspace_id' });
        if (settingsError) throw settingsError;
        if (tasks.length) {
          const { error: upsertError } = await client.from('tasks').upsert(tasks, { onConflict: 'id' });
          if (upsertError) throw upsertError;
        }
        const keepIds = new Set(tasks.map(task => task.id));
        const { data: existingRows, error: existingError } = await client.from('tasks').select('id').eq('workspace_id', workspace.id);
        if (existingError) throw existingError;
        const removeIds = (existingRows || []).map(row => row.id).filter(id => !keepIds.has(id));
        if (removeIds.length) {
          const { error: deleteError } = await client.from('tasks').delete().eq('workspace_id', workspace.id).in('id', removeIds);
          if (deleteError) throw deleteError;
        }
        break;
      }
      default:
        throw new Error(`Unknown sync operation: ${operation.type}`);
    }
  }

  async function flushQueue() {
    if (flushing || !navigator.onLine || !client || !workspace?.id) return;
    flushing = true;
    try {
      const operations = await getOperations();
      if (!operations.length) {
        notifyStatus('synced', 'All changes saved to cloud');
        return;
      }
      notifyStatus('saving', `Syncing ${operations.length} queued change${operations.length === 1 ? '' : 's'}…`);
      for (const operation of operations.sort((a, b) => a.createdAt - b.createdAt)) {
        await executeOperation(operation);
        await deleteOperation(operation.key);
      }
      notifyStatus('synced', 'All queued changes synced');
      callbacks.onQueueFlushed?.();
    } catch (error) {
      notifyStatus('queued', `Some changes are still queued: ${error.message}`);
      throw error;
    } finally {
      flushing = false;
    }
  }

  function subscribe() {
    unsubscribe();
    if (!client || !workspace?.id) return;
    const taskHandler = payload => callbacks.onRemoteTask?.({
      eventType: payload.eventType,
      task: payload.new?.id ? mapTaskFromRow(payload.new) : null,
      oldId: payload.old?.id || null
    });
    channel = client
      .channel(`africago-workspace-${workspace.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspace.id}`
      }, taskHandler)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspace.id}`
      }, taskHandler)
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'tasks'
      }, taskHandler)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'workspace_settings', filter: `workspace_id=eq.${workspace.id}`
      }, payload => {
        if (payload.new?.workspace_id) callbacks.onRemoteSettings?.(mapSettings(payload.new));
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'activity_log', filter: `workspace_id=eq.${workspace.id}`
      }, () => callbacks.onActivity?.())
      .subscribe(status => {
        if (status === 'SUBSCRIBED') notifyStatus('synced', 'Live sync connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') notifyStatus('queued', 'Live sync reconnecting…');
      });
  }

  function unsubscribe() {
    if (client && channel) client.removeChannel(channel).catch(() => {});
    channel = null;
  }

  async function openQueueDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(QUEUE_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, action) {
    const db = await openQueueDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, mode);
      const store = tx.objectStore(QUEUE_STORE);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function putOperation(operation) {
    try { await withStore('readwrite', store => store.put(operation)); }
    catch { localStorage.setItem(`africagoQueue:${operation.key}`, JSON.stringify(operation)); }
  }

  async function deleteOperation(key) {
    try { await withStore('readwrite', store => store.delete(key)); }
    catch { localStorage.removeItem(`africagoQueue:${key}`); }
  }

  async function getOperations() {
    try {
      return await withStore('readonly', store => store.getAll());
    } catch {
      return Object.keys(localStorage)
        .filter(key => key.startsWith('africagoQueue:'))
        .map(key => {
          try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
        })
        .filter(Boolean);
    }
  }

  window.AfricaGoCloud = {
    isConfigured,
    init,
    signUp,
    signIn,
    signOut,
    getSession,
    getUser,
    getCurrentWorkspace,
    createWorkspace,
    joinWorkspace,
    useWorkspace,
    loadWorkspaceState,
    refreshMeta,
    saveTask,
    deleteTask,
    saveSettings,
    saveAll,
    replaceState,
    flushQueue,
    subscribe,
    unsubscribe
  };
})();
