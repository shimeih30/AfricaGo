(() => {
  'use strict';

  const STORAGE_KEY = 'africagoTrackerV1';
  const NOTIFIED_KEY = 'africagoTrackerLastNotification';
  const THEME_KEY = 'africagoTrackerTheme';
  const founderNames = [
    'Farai Shimeih Gwapedza',
    'Panashe Gwapedza',
    'Takunda Tavonga Gwapedza'
  ];

  const milestoneOrder = ['Foundation', 'Licensing', 'Research', 'Incorporation', 'Partnerships', 'MVP', 'Pilot', 'Ongoing'];
  const milestoneMeta = {
    Foundation: { window: 'Days 1–3', description: 'Align the founding team and prepare company formation.' },
    Licensing: { window: 'Days 1–7', description: 'Clarify the legal and tourism licensing route before taking bookings.' },
    Research: { window: 'Days 1–10', description: 'Validate traveller demand and partner economics with real interviews.' },
    Incorporation: { window: 'Days 7–14', description: 'Create the legal and financial operating foundation.' },
    Partnerships: { window: 'Days 10–20', description: 'Secure pilot supply, rates, terms and workable itineraries.' },
    MVP: { window: 'Days 15–25', description: 'Build the lean website, enquiry process and manual operating system.' },
    Pilot: { window: 'Days 21–30', description: 'Run a controlled test and measure real enquiries, quotes and conversions.' },
    Ongoing: { window: 'Ongoing', description: 'Important controls and decisions without a fixed milestone window.' }
  };

  const seedDefinitions = [
    { title: 'Complete all co-founder legal and contact information', day: 2, milestone: 'Foundation', category: 'Governance', priority: 'High', notes: 'Collect full names, IDs or passports, residential addresses, phone numbers and email addresses.' },
    { title: 'Agree interim co-founder roles and weekly responsibilities', day: 3, milestone: 'Foundation', category: 'Governance', priority: 'High', notes: 'Assign accountable leads for finance, licensing, partnerships, operations, technology and marketing.' },
    { title: 'Agree founder shareholding process and investor-control guardrails', day: 7, milestone: 'Foundation', category: 'Shareholding', priority: 'High', notes: 'Do not issue or promise shares before contribution records, vesting, reserved matters and legal review.' },
    { title: 'Shortlist five company names and backup options', day: 2, milestone: 'Foundation', category: 'Company formation', priority: 'Medium', notes: 'Include AfricaGo and alternatives suitable for name, domain and trademark checks.' },
    { title: 'Obtain a company-formation quotation', day: 3, milestone: 'Foundation', category: 'Company formation', priority: 'Medium', notes: 'Confirm incorporation documents, officer requirements, beneficial ownership and professional fees.' },

    { title: 'Send ZTA pre-application classification request', day: 7, milestone: 'Licensing', category: 'Licensing', priority: 'High', notes: 'Request written guidance before offering or confirming regulated travel-agency services.' },
    { title: 'Confirm whether an office lease or title is required', day: 10, milestone: 'Licensing', category: 'Licensing', priority: 'High', notes: 'Obtain written guidance for the correct tourism category.' },
    { title: 'Request public-liability insurance quotations', day: 14, milestone: 'Licensing', category: 'Insurance', priority: 'High', notes: 'Confirm minimum cover, exclusions and whether wording is acceptable to ZTA.' },
    { title: 'Confirm travel-agency association membership route', day: 14, milestone: 'Licensing', category: 'Licensing', priority: 'Medium', notes: 'Check admission requirements, fees and whether membership applies to the confirmed category.' },
    { title: 'Determine data-controller licence tier and appoint a DPO lead', day: 14, milestone: 'Licensing', category: 'Data protection', priority: 'High', notes: 'Document the customer and partner data AfricaGo will process.' },

    { title: 'Interview at least 15 tourism businesses', day: 10, milestone: 'Research', category: 'Market research', priority: 'High', notes: 'Capture prices, commission appetite, booking workflow, response times, pain points and decision makers.' },
    { title: 'Interview at least 20 prospective travellers', day: 10, milestone: 'Research', category: 'Market research', priority: 'High', notes: 'Test planning friction, trust needs, payment preferences and willingness to pay.' },
    { title: 'Summarise research findings and key business-model changes', day: 12, milestone: 'Research', category: 'Market research', priority: 'Medium', notes: 'Separate evidence from opinions and record the next experiments.' },

    { title: 'Register the company after founder and licensing decisions', day: 14, milestone: 'Incorporation', category: 'Company formation', priority: 'High', notes: 'Do not complete the share allocation until all founders have agreed and legal drafting is ready.' },
    { title: 'Open the internal accounting ledger', day: 14, milestone: 'Incorporation', category: 'Finance', priority: 'High', notes: 'Record founder contributions as equity, founder loans or reimbursable expenses.' },
    { title: 'Confirm registered office and operating address', day: 14, milestone: 'Incorporation', category: 'Company formation', priority: 'Medium', notes: 'Ensure the address works for incorporation, licensing and official correspondence.' },
    { title: 'Select business bank and payment approach', day: 18, milestone: 'Incorporation', category: 'Finance', priority: 'High', notes: 'Keep high-value supplier payments direct to suppliers during the pilot unless controls are approved.' },

    { title: 'Negotiate five pilot partner schedules', day: 20, milestone: 'Partnerships', category: 'Partner acquisition', priority: 'High', notes: 'Get written rates, commissions, response targets, cancellation rules and emergency contacts.' },
    { title: 'Verify initial pilot partners', day: 20, milestone: 'Partnerships', category: 'Verification', priority: 'High', notes: 'Check existence, licences, insurance, photos, safety, rates and complaint process.' },
    { title: 'Test three complete sample itineraries', day: 20, milestone: 'Partnerships', category: 'Product', priority: 'High', notes: 'Test realistic timings, prices, supplier handoffs and weather alternatives.' },
    { title: 'Collect approved partner rates, cancellation rules and contacts', day: 20, milestone: 'Partnerships', category: 'Partner data', priority: 'Medium', notes: 'Store current source evidence and validity dates.' },

    { title: 'Create the AfricaGo landing page', day: 25, milestone: 'MVP', category: 'Website', priority: 'High', notes: 'Explain the offer, destinations, verification approach and local support.' },
    { title: 'Create the custom itinerary enquiry form', day: 25, milestone: 'MVP', category: 'Website', priority: 'High', notes: 'Capture dates, group, budget, interests, contact and consent.' },
    { title: 'Prepare and publish the approved privacy notice', day: 25, milestone: 'MVP', category: 'Legal', priority: 'High', notes: 'Publish only after legal and DPO review.' },
    { title: 'Set up the manual lead and booking CRM', day: 25, milestone: 'MVP', category: 'Operations', priority: 'High', notes: 'Track leads, quotes, supplier confirmations, commissions and complaints.' },
    { title: 'Set up company domain, email and shared account recovery', day: 23, milestone: 'MVP', category: 'Technology', priority: 'Medium', notes: 'Use company-owned accounts with recovery access held by at least two founders.' },

    { title: 'Run a closed pilot without holding supplier funds', day: 30, milestone: 'Pilot', category: 'Pilot', priority: 'High', notes: 'Use direct-to-supplier payments for high-value services until contracts and controls are approved.' },
    { title: 'Secure the first genuine itinerary enquiry', day: 30, milestone: 'Pilot', category: 'Sales', priority: 'High', notes: 'Record lead source, qualification, response time and outcome.' },
    { title: 'Issue the first itemised trip quotation', day: 30, milestone: 'Pilot', category: 'Sales', priority: 'High', notes: 'Show supplier, inclusions, exclusions, payment recipient, validity and cancellation terms.' },
    { title: 'Review pilot results and approve the next 30-day sprint', day: 30, milestone: 'Pilot', category: 'Management', priority: 'High', notes: 'Review enquiries, conversions, contribution margin, partner response, incidents and cash.' },

    { title: 'Maintain the licence, insurance and renewal register', day: null, milestone: 'Ongoing', category: 'Compliance', priority: 'Medium', notes: 'Record expiry dates, responsible person and required lead time.' },
    { title: 'Hold the weekly co-founders operating review', day: null, milestone: 'Ongoing', category: 'Management', priority: 'Medium', notes: 'Review tasks, cash, leads, bookings, partner issues, risk and decisions.' }
  ];

  const els = {};
  const Cloud = window.AfricaGoCloud;
  let state = loadState();
  let currentView = 'tasks';
  let cloudMode = 'disconnected';
  let cloudWorkspace = null;
  let cloudUser = null;
  let cloudMembers = [];
  let cloudActivity = [];
  let cloudStatus = { type: 'local', message: 'Local mode' };
  let activityRefreshTimer = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    applyStoredTheme();
    cacheElements();
    bindEvents();
    updateThemeButton();
    registerServiceWorker();
    setInterval(checkDueNotifications, 15 * 60 * 1000);
    window.addEventListener('online', updateNetworkBanner);
    window.addEventListener('offline', updateNetworkBanner);
    updateNetworkBanner();

    showCloudGate('loading', 'Checking cloud configuration and your account.');
    try {
      const result = await Cloud.init({
        onStatus: updateCloudStatus,
        onRemoteTask: handleRemoteTask,
        onRemoteSettings: handleRemoteSettings,
        onActivity: scheduleActivityRefresh,
        onQueueFlushed: scheduleActivityRefresh,
        onAuthChange: handleAuthChange
      });
      if (!result.configured) {
        cloudMode = 'local';
        updateCloudStatus({ type: 'setup', message: 'Cloud setup required' });
        showCloudGate('config');
        return;
      }
      if (!result.session) {
        updateCloudStatus({ type: 'disconnected', message: 'Sign in to sync' });
        showCloudGate('auth');
        return;
      }
      await finishCloudSession(result.session);
    } catch (error) {
      console.error(error);
      updateCloudStatus({ type: 'queued', message: 'Cloud connection unavailable' });
      els.cloudGateMessage.textContent = error.message || 'The cloud service could not be reached.';
      showCloudGate(Cloud.isConfigured() ? 'auth' : 'config');
    }
  }

  function cacheElements() {
    [
      'sidebar','menuButton','pageEyebrow','pageTitle','notifyButton','addTaskButton','alertStrip',
      'totalCount','openCount','dueSoonCount','overdueCount','completedCount','completionPercent',
      'progressLabel','progressPercent','progressBar','searchInput','statusFilter','assigneeFilter',
      'dateFilter','sortSelect','taskList','taskResultCount','taskListHeading','emptyState','taskTemplate',
      'milestoneTimeline','calendarExportButton','settingsStartDate','sidebarStartDate','shiftDatesButton',
      'peopleList','newPersonInput','addPersonButton','notificationStatus','settingsNotifyButton','exportButton',
      'csvExportButton','importInput','resetButton','taskDialog','taskForm','taskDialogTitle','taskId','taskTitle',
      'taskStatus','taskAssignee','taskDueDate','taskPriority','taskCategory','taskMilestone','taskNotes',
      'deleteTaskButton','closeTaskDialog','cancelTaskButton','setupDialog','setupForm','setupStartDate','toastRegion',
      'themeButton','mobileAddButton','sidebarBackdrop','cloudStatusChip','cloudStatusText','accountButton',
      'workspaceNameSidebar','syncNote','offlineBanner','cloudGate','cloudGateMessage','cloudConfigPanel','authPanel',
      'workspacePanel','cloudLoadingPanel','cloudLoadingText','configContinueOffline','authContinueOffline','showSignInButton',
      'showSignUpButton','signInForm','signInEmail','signInPassword','signUpForm','signUpName','signUpEmail',
      'signUpPassword','createWorkspaceForm','createWorkspaceName','joinWorkspaceForm','joinWorkspaceCode',
      'workspaceNameSetting','syncStatusDetailed','workspaceJoinCode','copyJoinCodeButton','memberList','syncNowButton',
      'accountName','accountEmail','accountConnectButton','signOutButton','activityList'
    ].forEach(id => els[id] = document.getElementById(id));
    els.views = {
      tasks: document.getElementById('tasksView'),
      milestones: document.getElementById('milestonesView'),
      settings: document.getElementById('settingsView')
    };
    els.navItems = [...document.querySelectorAll('.nav-item')];
  }

  function bindEvents() {
    els.setupForm.addEventListener('submit', event => {
      event.preventDefault();
      const startDate = els.setupStartDate.value;
      if (!startDate) return;
      state = createInitialState(startDate);
      saveState({ replace: true });
      els.setupDialog.close();
      renderAll();
      toast('AfricaGo tracker created.');
    });

    els.navItems.forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
    els.menuButton.addEventListener('click', toggleSidebar);
    els.sidebarStartDate.addEventListener('click', () => switchView('settings'));

    els.addTaskButton.addEventListener('click', () => openTaskDialog());
    els.mobileAddButton.addEventListener('click', () => openTaskDialog());
    els.themeButton.addEventListener('click', toggleTheme);
    els.sidebarBackdrop.addEventListener('click', closeSidebar);
    els.closeTaskDialog.addEventListener('click', closeTaskDialog);
    els.cancelTaskButton.addEventListener('click', closeTaskDialog);
    els.taskForm.addEventListener('submit', saveTaskFromForm);
    els.deleteTaskButton.addEventListener('click', deleteCurrentTask);

    [els.searchInput, els.statusFilter, els.assigneeFilter, els.dateFilter, els.sortSelect]
      .forEach(control => control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderTasks));

    els.notifyButton.addEventListener('click', requestNotifications);
    els.settingsNotifyButton.addEventListener('click', requestNotifications);
    els.calendarExportButton.addEventListener('click', exportICS);
    els.exportButton.addEventListener('click', exportJSON);
    els.csvExportButton.addEventListener('click', exportCSV);
    els.importInput.addEventListener('change', importJSON);
    els.resetButton.addEventListener('click', resetTracker);
    els.addPersonButton.addEventListener('click', addPerson);
    els.newPersonInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addPerson(); } });
    els.shiftDatesButton.addEventListener('click', shiftProjectDates);

    els.cloudStatusChip.addEventListener('click', () => switchView('settings'));
    els.accountButton.addEventListener('click', () => switchView('settings'));
    els.configContinueOffline.addEventListener('click', continueOffline);
    els.authContinueOffline.addEventListener('click', continueOffline);
    els.showSignInButton.addEventListener('click', () => showAuthTab('signin'));
    els.showSignUpButton.addEventListener('click', () => showAuthTab('signup'));
    els.signInForm.addEventListener('submit', signInFromForm);
    els.signUpForm.addEventListener('submit', signUpFromForm);
    els.createWorkspaceForm.addEventListener('submit', createWorkspaceFromForm);
    els.joinWorkspaceForm.addEventListener('submit', joinWorkspaceFromForm);
    els.copyJoinCodeButton.addEventListener('click', copyJoinCode);
    els.syncNowButton.addEventListener('click', syncNow);
    els.signOutButton.addEventListener('click', signOut);
    els.accountConnectButton.addEventListener('click', () => showCloudGate(Cloud.isConfigured() ? 'auth' : 'config'));

    window.addEventListener('click', event => {
      if (window.innerWidth <= 900 && els.sidebar.classList.contains('open') && !els.sidebar.contains(event.target) && !els.menuButton.contains(event.target)) {
        closeSidebar();
      }
    });

    window.addEventListener('keydown', event => {
      if ((event.key === 'n' || event.key === 'N') && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        openTaskDialog();
      }
      if (event.key === 'Escape') closeSidebar();
    });
  }

  function toggleSidebar() {
    const isOpen = els.sidebar.classList.toggle('open');
    els.sidebarBackdrop.classList.toggle('active', isOpen);
    els.menuButton.setAttribute('aria-expanded', String(isOpen));
  }

  function closeSidebar() {
    if (!els.sidebar) return;
    els.sidebar.classList.remove('open');
    els.sidebarBackdrop?.classList.remove('active');
    els.menuButton?.setAttribute('aria-expanded', 'false');
  }

  function applyStoredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const theme = saved || (systemDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    updateThemeColor(theme);
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    updateThemeColor(next);
    updateThemeButton();
    toast(`${next === 'dark' ? 'Dark' : 'Light'} appearance enabled.`);
  }

  function updateThemeButton() {
    if (!els.themeButton) return;
    const isDark = document.documentElement.dataset.theme === 'dark';
    els.themeButton.setAttribute('aria-label', isDark ? 'Switch to light appearance' : 'Switch to dark appearance');
    els.themeButton.title = isDark ? 'Switch to light appearance' : 'Switch to dark appearance';
  }

  function updateThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0b1815' : '#102f29';
  }

  function createInitialState(startDate) {
    return {
      version: 2,
      projectName: 'AfricaGo Launch',
      projectStartDate: startDate,
      people: [...founderNames, 'Unassigned'],
      tasks: seedDefinitions.map((definition, index) => ({
        id: cryptoId(),
        title: definition.title,
        status: 'Not started',
        assignee: 'Unassigned',
        dueDate: definition.day ? addDays(startDate, definition.day - 1) : '',
        priority: definition.priority,
        category: definition.category,
        milestone: definition.milestone,
        notes: definition.notes,
        relativeDay: definition.day,
        seeded: true,
        createdAt: new Date(Date.now() + index).toISOString(),
        updatedAt: new Date(Date.now() + index).toISOString(),
        completedAt: null
      }))
    };
  }

  function normaliseState() {
    state.people = Array.isArray(state.people) ? state.people : [...founderNames, 'Unassigned'];
    founderNames.forEach(name => { if (!state.people.includes(name)) state.people.unshift(name); });
    if (!state.people.includes('Unassigned')) state.people.push('Unassigned');
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.tasks.forEach(task => {
      task.status ||= 'Not started';
      task.assignee ||= 'Unassigned';
      task.priority ||= 'Medium';
      task.category ||= 'General';
      task.milestone ||= 'Ongoing';
      task.notes ||= '';
      task.createdAt ||= new Date().toISOString();
      task.updatedAt ||= task.createdAt;
    });
  }

  function renderAll() {
    renderPeopleOptions();
    renderTasks();
    renderMilestones();
    renderSettings();
    renderNotificationStatus();
    renderCloudSettings();
  }

  function switchView(view) {
    currentView = view;
    const labels = {
      tasks: ['AFRICAGO LAUNCH', 'Tasks'],
      milestones: ['30-DAY PLAN', 'Milestones'],
      settings: ['TRACKER CONTROL', 'Settings']
    };
    Object.entries(els.views).forEach(([name, element]) => element.classList.toggle('active', name === view));
    els.navItems.forEach(button => button.classList.toggle('active', button.dataset.view === view));
    els.pageEyebrow.textContent = labels[view][0];
    els.pageTitle.textContent = labels[view][1];
    els.addTaskButton.classList.toggle('hidden', view === 'settings');
    els.mobileAddButton.classList.toggle('hidden', view === 'settings');
    closeSidebar();
    if (view === 'milestones') renderMilestones();
    if (view === 'settings') renderSettings();
  }

  function renderTasks() {
    if (!state) return;
    const tasks = getFilteredTasks();
    els.taskList.innerHTML = '';
    tasks.forEach(task => els.taskList.appendChild(createTaskCard(task)));
    els.taskResultCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
    els.emptyState.classList.toggle('hidden', tasks.length !== 0);
    renderSummary();
  }

  function getFilteredTasks() {
    const query = els.searchInput.value.trim().toLowerCase();
    const status = els.statusFilter.value;
    const assignee = els.assigneeFilter.value;
    const dateFilter = els.dateFilter.value;
    const today = startOfDay(new Date());

    const filtered = state.tasks.filter(task => {
      const haystack = `${task.title} ${task.notes} ${task.category} ${task.milestone}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (status !== 'all' && task.status !== status) return false;
      if (assignee !== 'all' && task.assignee !== assignee) return false;
      const due = task.dueDate ? parseISODate(task.dueDate) : null;
      const days = due ? dateDiffDays(today, due) : null;
      if (dateFilter === 'overdue' && !(days < 0 && task.status !== 'Done')) return false;
      if (dateFilter === 'today' && !(days === 0 && task.status !== 'Done')) return false;
      if (dateFilter === 'soon' && !(days >= 0 && days <= 3 && task.status !== 'Done')) return false;
      if (dateFilter === 'week' && !(days >= 0 && days <= 7 && task.status !== 'Done')) return false;
      if (dateFilter === 'nodate' && task.dueDate) return false;
      return true;
    });

    const priorityValue = { High: 0, Medium: 1, Low: 2 };
    filtered.sort((a, b) => {
      switch (els.sortSelect.value) {
        case 'dueDesc': return compareDates(b.dueDate, a.dueDate);
        case 'priority': return priorityValue[a.priority] - priorityValue[b.priority] || compareDates(a.dueDate, b.dueDate);
        case 'created': return new Date(b.createdAt) - new Date(a.createdAt);
        default: return compareDates(a.dueDate, b.dueDate);
      }
    });
    return filtered;
  }

  function createTaskCard(task) {
    const fragment = els.taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector('.task-card');
    const toggle = fragment.querySelector('.complete-toggle');
    const badges = fragment.querySelector('.task-badges');
    const title = fragment.querySelector('.task-title');
    const notes = fragment.querySelector('.task-notes');
    const owner = fragment.querySelector('.task-owner');
    const date = fragment.querySelector('.task-date');
    const category = fragment.querySelector('.task-category');
    const menu = fragment.querySelector('.task-menu-button');

    card.dataset.id = task.id;
    card.classList.toggle('completed', task.status === 'Done');
    toggle.classList.toggle('done', task.status === 'Done');
    title.textContent = task.title;
    notes.textContent = task.notes;
    notes.classList.toggle('hidden', !task.notes);
    owner.textContent = task.assignee;
    date.textContent = task.dueDate ? formatDate(task.dueDate) : 'No due date';
    category.textContent = `${task.category} · ${task.milestone}${task.updatedByName ? ` · edited by ${task.updatedByName}` : ''}`;

    badges.appendChild(makeBadge(task.status, `status-${slug(task.status)}`));
    badges.appendChild(makeBadge(task.priority, `priority-${slug(task.priority)}`));
    const flag = getDateFlag(task);
    if (flag) badges.appendChild(makeBadge(flag.label, flag.className));

    toggle.addEventListener('click', () => toggleTask(task.id));
    menu.addEventListener('click', () => openTaskDialog(task));
    card.addEventListener('dblclick', () => openTaskDialog(task));
    return fragment;
  }

  function makeBadge(text, className) {
    const span = document.createElement('span');
    span.className = `badge ${className}`;
    span.textContent = text;
    return span;
  }

  function renderSummary() {
    const total = state.tasks.length;
    const done = state.tasks.filter(task => task.status === 'Done').length;
    const open = total - done;
    const overdue = state.tasks.filter(task => getDateFlag(task)?.type === 'overdue').length;
    const dueSoon = state.tasks.filter(task => ['today','soon'].includes(getDateFlag(task)?.type)).length;
    const pct = total ? Math.round(done / total * 100) : 0;

    els.totalCount.textContent = total;
    els.openCount.textContent = `${open} open`;
    els.dueSoonCount.textContent = dueSoon;
    els.overdueCount.textContent = overdue;
    els.completedCount.textContent = done;
    els.completionPercent.textContent = `${pct}% of total`;
    els.progressLabel.textContent = `${done} of ${total} tasks complete`;
    els.progressPercent.textContent = `${pct}%`;
    els.progressBar.style.width = `${pct}%`;

    if (overdue) {
      els.alertStrip.textContent = `${overdue} overdue task${overdue === 1 ? '' : 's'} need attention. Filter by “Overdue” to review them.`;
      els.alertStrip.classList.remove('hidden');
    } else {
      els.alertStrip.classList.add('hidden');
    }
  }

  function renderMilestones() {
    if (!state) return;
    els.milestoneTimeline.innerHTML = '';
    milestoneOrder.forEach(milestone => {
      const tasks = state.tasks.filter(task => task.milestone === milestone);
      if (!tasks.length) return;
      const done = tasks.filter(task => task.status === 'Done').length;
      const pct = Math.round(done / tasks.length * 100);
      const card = document.createElement('article');
      card.className = 'milestone-card';
      const taskRows = tasks
        .sort((a,b) => compareDates(a.dueDate,b.dueDate))
        .map(task => `<div class="milestone-task ${task.status === 'Done' ? 'done' : ''}"><span>${task.status === 'Done' ? '✓' : '○'}</span><span>${escapeHTML(task.title)}</span></div>`)
        .join('');
      card.innerHTML = `
        <div class="milestone-window">${milestoneMeta[milestone]?.window || milestone}</div>
        <div>
          <h4>${milestone}</h4>
          <p>${milestoneMeta[milestone]?.description || ''}</p>
          <div class="milestone-tasks">${taskRows}</div>
        </div>
        <div class="milestone-score">
          ${done}/${tasks.length}
          <div class="mini-progress"><span style="width:${pct}%"></span></div>
        </div>`;
      els.milestoneTimeline.appendChild(card);
    });
  }

  function renderPeopleOptions() {
    const currentFilter = els.assigneeFilter.value || 'all';
    const currentTask = els.taskAssignee.value || 'Unassigned';
    els.assigneeFilter.innerHTML = '<option value="all">All people</option>' + state.people.map(person => `<option value="${escapeAttr(person)}">${escapeHTML(person)}</option>`).join('');
    els.taskAssignee.innerHTML = state.people.map(person => `<option value="${escapeAttr(person)}">${escapeHTML(person)}</option>`).join('');
    els.assigneeFilter.value = state.people.includes(currentFilter) ? currentFilter : 'all';
    els.taskAssignee.value = state.people.includes(currentTask) ? currentTask : 'Unassigned';
  }

  function renderSettings() {
    if (!state) return;
    els.settingsStartDate.value = state.projectStartDate;
    els.sidebarStartDate.textContent = formatDate(state.projectStartDate);
    els.peopleList.innerHTML = '';
    state.people.filter(person => person !== 'Unassigned').forEach(person => {
      const row = document.createElement('div');
      const isFounder = founderNames.includes(person);
      row.className = `person-row ${isFounder ? 'founder' : ''}`;
      row.innerHTML = `<span>${escapeHTML(person)}${isFounder ? ' · Co-founder' : ''}</span><button type="button">Remove</button>`;
      row.querySelector('button').addEventListener('click', () => removePerson(person));
      els.peopleList.appendChild(row);
    });
  }

  function renderNotificationStatus() {
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'unsupported';
    const messages = {
      granted: 'Browser reminders are enabled. The tracker checks due tasks when open.',
      denied: 'Browser reminders were blocked. Use calendar export or change browser permissions.',
      default: 'Browser reminders are not enabled.',
      unsupported: 'This browser does not support local notifications.'
    };
    els.notificationStatus.textContent = messages[permission];
    els.notifyButton.textContent = permission === 'granted' ? 'Reminders enabled' : 'Enable reminders';
    els.settingsNotifyButton.textContent = permission === 'granted' ? 'Reminders enabled' : 'Enable browser reminders';
    els.notifyButton.disabled = permission === 'granted';
    els.settingsNotifyButton.disabled = permission === 'granted';
  }

  function openTaskDialog(task = null) {
    if (!state) return;
    renderPeopleOptions();
    els.taskDialogTitle.textContent = task ? 'Edit task' : 'Add task';
    els.taskId.value = task?.id || '';
    els.taskTitle.value = task?.title || '';
    els.taskStatus.value = task?.status || 'Not started';
    els.taskAssignee.value = task?.assignee || 'Unassigned';
    els.taskDueDate.value = task?.dueDate || '';
    els.taskPriority.value = task?.priority || 'Medium';
    els.taskCategory.value = task?.category || '';
    els.taskMilestone.value = task?.milestone || 'Ongoing';
    els.taskNotes.value = task?.notes || '';
    els.deleteTaskButton.classList.toggle('hidden', !task);
    els.taskDialog.showModal();
    setTimeout(() => els.taskTitle.focus(), 50);
  }

  function closeTaskDialog() {
    els.taskDialog.close();
    els.taskForm.reset();
  }

  function saveTaskFromForm(event) {
    event.preventDefault();
    const id = els.taskId.value;
    const existing = state.tasks.find(task => task.id === id);
    const task = {
      id: id || cryptoId(),
      title: els.taskTitle.value.trim(),
      status: els.taskStatus.value,
      assignee: els.taskAssignee.value,
      dueDate: els.taskDueDate.value,
      priority: els.taskPriority.value,
      category: els.taskCategory.value.trim() || 'General',
      milestone: els.taskMilestone.value,
      notes: els.taskNotes.value.trim(),
      relativeDay: existing?.relativeDay ?? null,
      seeded: existing?.seeded ?? false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: existing?.createdBy || cloudUser?.id || null,
      completedAt: els.taskStatus.value === 'Done' ? (existing?.completedAt || new Date().toISOString()) : null
    };
    if (!task.title) return;
    if (existing) Object.assign(existing, task);
    else state.tasks.push(task);
    saveState({ task });
    closeTaskDialog();
    renderAll();
    toast(existing ? 'Task updated.' : 'Task added.');
  }

  function deleteCurrentTask() {
    const id = els.taskId.value;
    const task = state.tasks.find(item => item.id === id);
    if (!task || !confirm(`Delete “${task.title}”?`)) return;
    state.tasks = state.tasks.filter(item => item.id !== id);
    saveState({ deleteId: id });
    closeTaskDialog();
    renderAll();
    toast('Task deleted.');
  }

  function toggleTask(id) {
    const task = state.tasks.find(item => item.id === id);
    if (!task) return;
    const completed = task.status !== 'Done';
    task.status = completed ? 'Done' : 'Not started';
    task.completedAt = completed ? new Date().toISOString() : null;
    task.updatedAt = new Date().toISOString();
    saveState({ task });
    renderAll();
    if (completed) toast('Task completed.');
  }

  function addPerson() {
    const name = els.newPersonInput.value.trim();
    if (!name) return;
    if (state.people.some(person => person.toLowerCase() === name.toLowerCase())) {
      toast('That person is already listed.', true);
      return;
    }
    state.people.splice(Math.max(0, state.people.length - 1), 0, name);
    els.newPersonInput.value = '';
    saveState({ settings: true });
    renderAll();
    toast(`${name} added.`);
  }

  function removePerson(person) {
    if (founderNames.includes(person)) return;
    if (!confirm(`Remove ${person}? Their tasks will become Unassigned.`)) return;
    state.people = state.people.filter(item => item !== person);
    state.tasks.forEach(task => { if (task.assignee === person) { task.assignee = 'Unassigned'; task.updatedAt = new Date().toISOString(); } });
    saveState({ all: true });
    renderAll();
  }

  function shiftProjectDates() {
    const newDate = els.settingsStartDate.value;
    if (!newDate || newDate === state.projectStartDate) {
      toast('No date change to apply.');
      return;
    }
    const delta = dateDiffDays(parseISODate(state.projectStartDate), parseISODate(newDate));
    if (!confirm(`Shift all milestone task dates by ${delta} day${Math.abs(delta) === 1 ? '' : 's'}?`)) return;
    state.tasks.forEach(task => {
      if (task.dueDate && task.milestone !== 'Ongoing') { task.dueDate = addDays(task.dueDate, delta); task.updatedAt = new Date().toISOString(); }
    });
    state.projectStartDate = newDate;
    saveState({ all: true });
    renderAll();
    toast('Project dates shifted.');
  }

  async function requestNotifications() {
    if (!('Notification' in window)) {
      toast('This browser does not support notifications.', true);
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      renderNotificationStatus();
      if (permission === 'granted') {
        toast('Browser reminders enabled.');
        checkDueNotifications(true);
      } else {
        toast('Notification permission was not granted.', true);
      }
    } catch (error) {
      toast('Notifications require the app to be opened from a secure web address or local server.', true);
    }
  }

  function checkDueNotifications(force = false) {
    if (!state || !('Notification' in window) || Notification.permission !== 'granted') return;
    const todayKey = toISODate(new Date());
    if (!force && localStorage.getItem(NOTIFIED_KEY) === todayKey) return;
    const overdue = state.tasks.filter(task => getDateFlag(task)?.type === 'overdue');
    const today = state.tasks.filter(task => getDateFlag(task)?.type === 'today');
    if (!overdue.length && !today.length) return;
    const parts = [];
    if (overdue.length) parts.push(`${overdue.length} overdue`);
    if (today.length) parts.push(`${today.length} due today`);
    new Notification('AfricaGo task reminder', {
      body: `${parts.join(' and ')}. Open the tracker to review them.`,
      icon: 'app-icon.svg',
      tag: 'africago-due-summary'
    });
    localStorage.setItem(NOTIFIED_KEY, todayKey);
  }

  function exportJSON() {
    downloadFile(`AfricaGo-tracker-backup-${toISODate(new Date())}.json`, JSON.stringify(state, null, 2), 'application/json');
    toast('Backup exported.');
  }

  function exportCSV() {
    const headers = ['Task','Status','Responsible person','Due date','Priority','Category','Milestone','Notes'];
    const rows = state.tasks.map(task => [task.title,task.status,task.assignee,task.dueDate,task.priority,task.category,task.milestone,task.notes]);
    const csv = [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
    downloadFile(`AfricaGo-tasks-${toISODate(new Date())}.csv`, csv, 'text/csv;charset=utf-8');
    toast('CSV exported.');
  }

  function exportICS() {
    const tasks = state.tasks.filter(task => task.dueDate && task.status !== 'Done');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AfricaGo//Milestone Tracker//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    tasks.forEach(task => {
      const compact = task.dueDate.replaceAll('-','');
      const nextDay = addDays(task.dueDate, 1).replaceAll('-','');
      lines.push(
        'BEGIN:VEVENT',
        `UID:${task.id}@africago.local`,
        `DTSTAMP:${icsTimestamp(new Date())}`,
        `DTSTART;VALUE=DATE:${compact}`,
        `DTEND;VALUE=DATE:${nextDay}`,
        `SUMMARY:${icsEscape(task.title)}`,
        `DESCRIPTION:${icsEscape(`${task.notes}\nResponsible: ${task.assignee}\nStatus: ${task.status}`)}`,
        `CATEGORIES:${icsEscape(task.category)}`,
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${icsEscape(`AfricaGo task due tomorrow: ${task.title}`)}`,
        'END:VALARM',
        'END:VEVENT'
      );
    });
    lines.push('END:VCALENDAR');
    downloadFile(`AfricaGo-task-calendar-${toISODate(new Date())}.ics`, lines.join('\r\n'), 'text/calendar;charset=utf-8');
    toast(`${tasks.length} open dated task${tasks.length === 1 ? '' : 's'} exported to calendar.`);
  }

  function importJSON(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported.tasks) || !Array.isArray(imported.people)) throw new Error('Invalid backup');
        if (!confirm(`Replace the current tracker with ${imported.tasks.length} imported tasks?`)) return;
        state = imported;
        normaliseState();
        saveState({ replace: true });
        renderAll();
        toast('Backup imported and queued for cloud sync.');
      } catch (error) {
        toast('That file is not a valid AfricaGo tracker backup.', true);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  async function resetTracker() {
    if (cloudMode === 'cloud') {
      if (!confirm('Clear only this device’s cached copy and reload the shared cloud workspace? The cloud data will not be deleted.')) return;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NOTIFIED_KEY);
      try {
        await connectWorkspace(cloudWorkspace, { forceRemote: true });
        toast('Local cache refreshed from cloud.');
      } catch (error) {
        toast(`Could not reload cloud data: ${error.message}`, true);
      }
      return;
    }
    if (!confirm('Reset the local tracker and erase all task changes on this device?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NOTIFIED_KEY);
    state = null;
    els.setupStartDate.value = toISODate(new Date());
    els.setupDialog.showModal();
  }

  function showCloudGate(panel, loadingText = '') {
    els.cloudGate.classList.remove('hidden');
    ['cloudConfigPanel','authPanel','workspacePanel','cloudLoadingPanel'].forEach(id => els[id].classList.add('hidden'));
    if (panel === 'config') els.cloudConfigPanel.classList.remove('hidden');
    if (panel === 'auth') { els.authPanel.classList.remove('hidden'); showAuthTab('signin'); }
    if (panel === 'workspace') els.workspacePanel.classList.remove('hidden');
    if (panel === 'loading') {
      els.cloudLoadingPanel.classList.remove('hidden');
      if (loadingText) els.cloudLoadingText.textContent = loadingText;
    }
  }

  function hideCloudGate() {
    els.cloudGate.classList.add('hidden');
  }

  function showAuthTab(tab) {
    const signIn = tab === 'signin';
    els.signInForm.classList.toggle('hidden', !signIn);
    els.signUpForm.classList.toggle('hidden', signIn);
    els.showSignInButton.classList.toggle('active', signIn);
    els.showSignUpButton.classList.toggle('active', !signIn);
  }

  function continueOffline() {
    cloudMode = 'local';
    cloudWorkspace = null;
    cloudUser = null;
    hideCloudGate();
    updateCloudStatus({ type: 'local', message: 'Local mode — not syncing' });
    startTrackerInterface();
  }

  function startTrackerInterface() {
    if (!state) {
      els.setupStartDate.value = toISODate(new Date());
      if (!els.setupDialog.open) els.setupDialog.showModal();
    } else {
      normaliseState();
      renderAll();
      checkDueNotifications();
    }
  }

  async function signInFromForm(event) {
    event.preventDefault();
    showCloudGate('loading', 'Signing you in…');
    try {
      const data = await Cloud.signIn({ email: els.signInEmail.value.trim(), password: els.signInPassword.value });
      await finishCloudSession(data.session);
    } catch (error) {
      els.cloudGateMessage.textContent = error.message;
      showCloudGate('auth');
      toast(error.message, true);
    }
  }

  async function signUpFromForm(event) {
    event.preventDefault();
    showCloudGate('loading', 'Creating your secure founder account…');
    try {
      const data = await Cloud.signUp({ fullName: els.signUpName.value.trim(), email: els.signUpEmail.value.trim(), password: els.signUpPassword.value });
      if (!data.session) {
        els.cloudGateMessage.textContent = 'Account created. Check your email to confirm it, then sign in.';
        showCloudGate('auth');
        showAuthTab('signin');
        return;
      }
      await finishCloudSession(data.session);
    } catch (error) {
      els.cloudGateMessage.textContent = error.message;
      showCloudGate('auth');
      showAuthTab('signup');
      toast(error.message, true);
    }
  }

  async function finishCloudSession(session) {
    cloudUser = session?.user || Cloud.getUser();
    showCloudGate('loading', 'Finding your AfricaGo workspace…');
    const workspace = await Cloud.getCurrentWorkspace();
    if (!workspace) {
      updateCloudStatus({ type: 'disconnected', message: 'Create or join a workspace' });
      showCloudGate('workspace');
      renderCloudSettings();
      return;
    }
    await connectWorkspace(workspace);
  }

  async function createWorkspaceFromForm(event) {
    event.preventDefault();
    showCloudGate('loading', 'Creating the shared AfricaGo workspace…');
    try {
      const workspace = await Cloud.createWorkspace(els.createWorkspaceName.value.trim());
      await connectWorkspace(workspace);
      toast('Shared AfricaGo workspace created.');
    } catch (error) {
      els.cloudGateMessage.textContent = error.message;
      showCloudGate('workspace');
      toast(error.message, true);
    }
  }

  async function joinWorkspaceFromForm(event) {
    event.preventDefault();
    showCloudGate('loading', 'Joining the shared AfricaGo workspace…');
    try {
      const workspace = await Cloud.joinWorkspace(els.joinWorkspaceCode.value.trim());
      await connectWorkspace(workspace);
      toast('You joined the AfricaGo workspace.');
    } catch (error) {
      els.cloudGateMessage.textContent = error.message;
      showCloudGate('workspace');
      toast(error.message, true);
    }
  }

  async function connectWorkspace(workspace, options = {}) {
    cloudWorkspace = workspace;
    cloudUser = Cloud.getUser();
    Cloud.useWorkspace(workspace);
    showCloudGate('loading', 'Downloading the latest shared tasks…');
    let remote;
    try {
      remote = await Cloud.loadWorkspaceState();
    } catch (error) {
      if (!state) throw error;
      cloudMode = 'cloud';
      updateCloudStatus({ type: 'offline', message: 'Offline — showing cached tasks' });
      hideCloudGate();
      startTrackerInterface();
      Cloud.subscribe();
      return;
    }

    cloudMembers = remote.members || [];
    cloudActivity = remote.activity || [];
    const hasRemoteTasks = remote.tasks?.length > 0;
    if (hasRemoteTasks || options.forceRemote) {
      state = stateFromRemote(remote);
      persistLocalState();
    } else if (state?.tasks?.length) {
      normaliseState();
      const shouldImport = confirm(`This workspace is empty. Upload the ${state.tasks.length} tasks already saved on this device?`);
      if (shouldImport) await Cloud.replaceState(state);
      else state = null;
    }

    cloudMode = 'cloud';
    Cloud.subscribe();
    Cloud.flushQueue().catch(() => {});
    hideCloudGate();
    updateCloudStatus({ type: 'synced', message: 'Live sync connected' });

    if (!state) {
      els.setupStartDate.value = toISODate(new Date());
      if (!els.setupDialog.open) els.setupDialog.showModal();
    } else {
      normaliseState();
      mergeMemberNamesIntoPeople();
      persistLocalState();
      renderAll();
      checkDueNotifications();
    }
  }

  function stateFromRemote(remote) {
    const settings = remote.settings || {};
    return {
      version: 2,
      projectName: settings.projectName || remote.workspace?.name || 'AfricaGo Launch',
      projectStartDate: settings.projectStartDate || state?.projectStartDate || toISODate(new Date()),
      people: settings.people?.length ? settings.people : [...founderNames, 'Unassigned'],
      tasks: remote.tasks || []
    };
  }

  function mergeMemberNamesIntoPeople() {
    if (!state) return;
    cloudMembers.forEach(member => {
      if (member.fullName && !state.people.includes(member.fullName)) state.people.splice(Math.max(0, state.people.length - 1), 0, member.fullName);
    });
  }

  function handleRemoteTask(change) {
    if (cloudMode !== 'cloud' || !state) return;
    if (change.eventType === 'DELETE') {
      if (change.oldId) state.tasks = state.tasks.filter(task => task.id !== change.oldId);
    } else if (change.task) {
      const existingIndex = state.tasks.findIndex(task => task.id === change.task.id);
      if (existingIndex >= 0) state.tasks[existingIndex] = change.task;
      else state.tasks.push(change.task);
    }
    persistLocalState();
    renderAll();
  }

  function handleRemoteSettings(settings) {
    if (cloudMode !== 'cloud' || !state) return;
    state.projectStartDate = settings.projectStartDate || state.projectStartDate;
    state.projectName = settings.projectName || state.projectName;
    if (settings.people?.length) state.people = settings.people;
    mergeMemberNamesIntoPeople();
    persistLocalState();
    renderAll();
  }

  function handleAuthChange({ event, session }) {
    if (event === 'SIGNED_OUT') {
      cloudMode = 'disconnected';
      cloudWorkspace = null;
      cloudUser = null;
      cloudMembers = [];
      cloudActivity = [];
      updateCloudStatus({ type: 'disconnected', message: 'Signed out' });
      showCloudGate('auth');
    }
    if (event === 'TOKEN_REFRESHED') cloudUser = session?.user || cloudUser;
  }

  function updateCloudStatus(nextStatus) {
    cloudStatus = nextStatus || cloudStatus;
    if (!els.cloudStatusChip) return;
    const type = cloudStatus.type || 'local';
    els.cloudStatusChip.dataset.status = type;
    els.cloudStatusText.textContent = cloudStatus.message || 'Cloud status';
    els.syncNote.textContent = cloudStatus.message || 'Cloud status';
    renderCloudSettings();
  }

  function updateNetworkBanner() {
    els.offlineBanner?.classList.toggle('hidden', navigator.onLine);
  }

  function renderCloudSettings() {
    if (!els.workspaceNameSetting) return;
    const connected = cloudMode === 'cloud' && cloudWorkspace;
    els.workspaceNameSetting.textContent = connected ? cloudWorkspace.name : 'Cloud not connected';
    els.workspaceNameSidebar.textContent = connected ? cloudWorkspace.name : 'Founder workspace';
    els.workspaceJoinCode.textContent = connected ? cloudWorkspace.join_code : '—';
    els.copyJoinCodeButton.disabled = !connected;
    els.syncNowButton.disabled = !connected;
    els.syncStatusDetailed.textContent = cloudStatus.message || (connected ? 'Connected' : 'Local mode');
    els.accountName.textContent = cloudUser?.user_metadata?.full_name || cloudUser?.email?.split('@')[0] || (connected ? 'Founder account' : 'Local mode');
    els.accountEmail.textContent = cloudUser?.email || 'Not signed in';
    els.signOutButton.classList.toggle('hidden', !cloudUser);
    els.accountConnectButton.classList.toggle('hidden', Boolean(cloudUser));
    els.accountButton.textContent = initials(els.accountName.textContent || 'AG');

    els.memberList.innerHTML = '';
    if (!cloudMembers.length) {
      els.memberList.innerHTML = '<p class="field-help">Members appear after cloud connection.</p>';
    } else {
      cloudMembers.forEach(member => {
        const row = document.createElement('div');
        row.className = 'member-row';
        row.innerHTML = `<span class="member-avatar">${escapeHTML(initials(member.fullName))}</span><span><strong>${escapeHTML(member.fullName)}</strong><small>${escapeHTML(member.email || member.role)}</small></span><em>${escapeHTML(member.role)}</em>`;
        els.memberList.appendChild(row);
      });
    }

    els.activityList.innerHTML = '';
    if (!cloudActivity.length) {
      els.activityList.innerHTML = '<p class="field-help">No cloud activity recorded yet.</p>';
    } else {
      cloudActivity.slice(0, 12).forEach(item => {
        const row = document.createElement('div');
        row.className = 'activity-row';
        const taskTitle = item.details?.title || item.details?.old_title || 'a task';
        row.innerHTML = `<span class="activity-dot"></span><div><strong>${escapeHTML(item.actorName)}</strong> ${escapeHTML(activityVerb(item.action))} <b>${escapeHTML(taskTitle)}</b><small>${escapeHTML(formatRelativeTime(item.created_at))}</small></div>`;
        els.activityList.appendChild(row);
      });
    }
  }

  function scheduleActivityRefresh() {
    if (cloudMode !== 'cloud') return;
    clearTimeout(activityRefreshTimer);
    activityRefreshTimer = setTimeout(async () => {
      try {
        const meta = await Cloud.refreshMeta();
        cloudMembers = meta.members || cloudMembers;
        cloudActivity = meta.activity || cloudActivity;
        mergeMemberNamesIntoPeople();
        renderCloudSettings();
      } catch {}
    }, 700);
  }

  async function syncNow() {
    if (cloudMode !== 'cloud' || !state) return;
    updateCloudStatus({ type: 'saving', message: 'Syncing the complete tracker…' });
    try {
      await Cloud.saveAll(state);
      await Cloud.flushQueue();
      scheduleActivityRefresh();
      toast('Shared tracker synced.');
    } catch (error) {
      toast(`Sync is queued: ${error.message}`, true);
    }
  }

  async function signOut() {
    if (!confirm('Sign out on this device? Your shared tasks will remain safely in the cloud.')) return;
    try {
      await Cloud.signOut();
      toast('Signed out.');
    } catch (error) {
      toast(error.message, true);
    }
  }

  async function copyJoinCode() {
    if (!cloudWorkspace?.join_code) return;
    try {
      await navigator.clipboard.writeText(cloudWorkspace.join_code);
      toast('Founder join code copied.');
    } catch {
      prompt('Copy this founder join code:', cloudWorkspace.join_code);
    }
  }

  function initials(value) {
    const parts = String(value || 'AG').trim().split(/\s+/).filter(Boolean);
    return (parts.length === 1 ? parts[0].slice(0, 2) : parts.slice(0, 2).map(part => part[0]).join('')).toUpperCase();
  }

  function activityVerb(action) {
    return ({ INSERT: 'created', UPDATE: 'updated', DELETE: 'deleted' })[action] || 'changed';
  }

  function formatRelativeTime(value) {
    const date = new Date(value);
    const seconds = Math.round((date - new Date()) / 1000);
    const abs = Math.abs(seconds);
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (abs < 60) return formatter.format(seconds, 'second');
    if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
    return formatter.format(Math.round(seconds / 86400), 'day');
  }

  function getDateFlag(task) {
    if (!task.dueDate || task.status === 'Done') return null;
    const days = dateDiffDays(startOfDay(new Date()), parseISODate(task.dueDate));
    if (days < 0) return { type: 'overdue', label: `${Math.abs(days)}d overdue`, className: 'date-overdue' };
    if (days === 0) return { type: 'today', label: 'Due today', className: 'date-today' };
    if (days <= 3) return { type: 'soon', label: `Due in ${days}d`, className: 'date-soon' };
    return null;
  }

  function saveState(options = {}) {
    persistLocalState();
    if (cloudMode !== 'cloud' || !cloudWorkspace) return;
    if (options.replace) Cloud.replaceState(state).then(scheduleActivityRefresh).catch(() => {});
    else if (options.all) Cloud.saveAll(state).then(scheduleActivityRefresh).catch(() => {});
    else {
      if (options.task) Cloud.saveTask(options.task).then(scheduleActivityRefresh).catch(() => {});
      if (options.deleteId) Cloud.deleteTask(options.deleteId).then(scheduleActivityRefresh).catch(() => {});
      if (options.settings) Cloud.saveSettings(state).then(scheduleActivityRefresh).catch(() => {});
    }
  }

  function persistLocalState() {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  function toast(message, isError = false) {
    const item = document.createElement('div');
    item.className = `toast ${isError ? 'error' : ''}`;
    item.textContent = message;
    els.toastRegion.appendChild(item);
    setTimeout(() => item.remove(), 3500);
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function compareDates(a, b) {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  }

  function addDays(dateString, days) {
    const date = typeof dateString === 'string' ? parseISODate(dateString) : new Date(dateString);
    date.setDate(date.getDate() + Number(days));
    return toISODate(date);
  }

  function parseISODate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dateDiffDays(from, to) {
    return Math.round((startOfDay(to) - startOfDay(from)) / 86400000);
  }

  function formatDate(value) {
    return parseISODate(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }

  function cryptoId() {
    return globalThis.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"','""')}"` : text;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function escapeAttr(value) { return escapeHTML(value); }
  function icsEscape(value) { return String(value ?? '').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'); }
  function icsTimestamp(date) { return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''); }
})();
