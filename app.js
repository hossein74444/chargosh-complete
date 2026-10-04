const state = loadState();
const modalRoot = document.getElementById('modal-root');
const viewRoot = document.getElementById('view-root');
const pageTitle = document.getElementById('page-title');
const navButtons = [...document.querySelectorAll('.nav-item')];
const primaryActionBtn = document.getElementById('btn-primary-action');
const exportBtn = document.getElementById('btn-export');
const toast = document.getElementById('toast');
const currentDate = new Date();
let currentCalendarDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let currentView = 'dashboard';

function loadState() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.storageKey);
    if (!raw) {
      return JSON.parse(JSON.stringify(APP_CONFIG.defaultState));
    }
    return JSON.parse(raw);
  } catch (error) {
    return JSON.parse(JSON.stringify(APP_CONFIG.defaultState));
  }
}

function saveState() {
  localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(state));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function formatMoney(value) {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat('fa-IR').format(number)} ${state.settings.currency || 'تومان'}`;
}

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const value = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(value);
  } catch {
    return dateString;
  }
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function renderView(viewName) {
  currentView = viewName;
  navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));

  const actions = {
    dashboard: { title: 'داشبورد', render: renderDashboard },
    projects: { title: 'پروژه‌ها', render: renderProjects },
    crm: { title: 'CRM مشتریان', render: renderCRM },
    accounting: { title: 'حسابداری', render: renderAccounting },
    kanban: { title: 'برد مراحل', render: renderKanban },
    calendar: { title: 'تقویم کاری', render: renderCalendar },
    reports: { title: 'گزارش‌ها', render: renderReports },
    settings: { title: 'تنظیمات', render: renderSettings }
  };

  const selected = actions[viewName] || actions.dashboard;
  pageTitle.textContent = selected.title;
  viewRoot.innerHTML = selected.render();

  if (viewName === 'projects') {
    primaryActionBtn.textContent = 'پروژه جدید';
    primaryActionBtn.onclick = () => openProjectModal();
  } else if (viewName === 'crm') {
    primaryActionBtn.textContent = 'مشتری جدید';
    primaryActionBtn.onclick = () => openCRMModal();
  } else if (viewName === 'accounting') {
    primaryActionBtn.textContent = 'ثبت سند';
    primaryActionBtn.onclick = () => openAccountingModal();
  } else {
    primaryActionBtn.textContent = 'پروژه جدید';
    primaryActionBtn.onclick = () => openProjectModal();
  }
}

function renderDashboard() {
  const totalProjects = state.projects.length;
  const activeProjects = state.projects.filter(p => !p.archived).length;
  const totalRevenue = state.projects.reduce((sum, item) => sum + Number(item.invoice || 0), 0);
  const totalCRM = state.crm.length;
  const avgProgress = totalProjects ? Math.round(state.projects.reduce((sum, item) => sum + Number(item.progress || 0), 0) / totalProjects) : 0;

  const recentProjects = [...state.projects].slice(0, 4);
  const recentCRM = [...state.crm].slice(0, 4);

  return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">تعداد پروژه‌ها</div>
        <div class="kpi-value">${totalProjects}</div>
        <div class="kpi-trend">${activeProjects} پروژه فعال</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">درآمد ثبت‌شده</div>
        <div class="kpi-value">${formatMoney(totalRevenue)}</div>
        <div class="kpi-trend">ثبت فاکتور</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">میانگین پیشرفت</div>
        <div class="kpi-value">${avgProgress}%</div>
        <div class="kpi-trend">در حال رشد</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">مشتریان CRM</div>
        <div class="kpi-value">${totalCRM}</div>
        <div class="kpi-trend">در لیست پیگیری</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <h3>پروژه‌های اخیر</h3>
        </div>
        <div class="list">
          ${recentProjects.map(project => `
            <div class="list-item">
              <div>
                <strong>${project.name}</strong><br />
                <small>${project.client}</small>
              </div>
              <span class="badge">${project.stage}</span>
            </div>
          `).join('') || '<div class="empty-state">پروژه‌ای ثبت نشده است.</div>'}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>پیگیری‌های CRM</h3>
        </div>
        <div class="list">
          ${recentCRM.map(item => `
            <div class="list-item">
              <div>
                <strong>${item.name}</strong><br />
                <small>${item.company}</small>
              </div>
              <span class="badge">${item.stage}</span>
            </div>
          `).join('') || '<div class="empty-state">مشتری جدیدی ثبت نشده است.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderProjects() {
  const filterText = (document.getElementById('project-search')?.value || '').trim().toLowerCase();
  const filterStage = document.getElementById('project-stage-filter')?.value || 'all';
  const filteredProjects = state.projects.filter(project => {
    const matchesText = !filterText || `${project.name} ${project.client}`.toLowerCase().includes(filterText);
    const matchesStage = filterStage === 'all' || project.stage === filterStage;
    return matchesText && matchesStage;
  });

  return `
    <div class="filter-bar">
      <label class="search-box">
        <span>⌕</span>
        <input id="project-search" type="search" placeholder="جستجو در نام پروژه یا مشتری..." value="${escapeHtml((document.getElementById('project-search')?.value || ''))}" />
      </label>
      <select id="project-stage-filter">
        <option value="all">همه مراحل</option>
        ${APP_CONFIG.defaultState.workflowStages.map(stage => `<option value="${stage}" ${filterStage === stage ? 'selected' : ''}>${stage}</option>`).join('')}
      </select>
      <button class="btn btn-secondary" data-action="project-new">پروژه جدید</button>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>لیست پروژه‌ها</h3>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>نام پروژه</th>
              <th>مشتری</th>
              <th>نوع</th>
              <th>مرحله</th>
              <th>پیشرفت</th>
              <th>بودجه</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProjects.length ? filteredProjects.map(project => `
              <tr>
                <td>${project.name}</td>
                <td>${project.client}</td>
                <td>${project.type}</td>
                <td><span class="badge">${project.stage}</span></td>
                <td>
                  <div class="progress-bar"><span style="width:${project.progress}%"></span></div>
                  ${project.progress}%
                </td>
                <td>${formatMoney(project.budget)}</td>
                <td>
                  <div class="inline-actions">
                    <button class="small-btn" data-action="project-edit" data-id="${project.id}">ویرایش</button>
                    <button class="small-btn" data-action="project-delete" data-id="${project.id}">حذف</button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="7"><div class="empty-state">پروژه‌ای پیدا نشد.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindProjectFilters();
  bindActionButtons();
}

function renderCRM() {
  return `
    <div class="filter-bar">
      <button class="btn btn-secondary" data-action="crm-new">مشتری جدید</button>
    </div>
    <div class="panel">
      <div class="panel-header">
        <h3>لیست مشتریان</h3>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>نام</th>
              <th>شرکت</th>
              <th>تلفن</th>
              <th>مرحله</th>
              <th>ارزش</th>
              <th>آخرین تماس</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${state.crm.length ? state.crm.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.company}</td>
                <td>${item.phone}</td>
                <td><span class="badge">${item.stage}</span></td>
                <td>${formatMoney(item.value)}</td>
                <td>${formatDate(item.lastContact)}</td>
                <td>
                  <div class="inline-actions">
                    <button class="small-btn" data-action="crm-edit" data-id="${item.id}">ویرایش</button>
                    <button class="small-btn" data-action="crm-delete" data-id="${item.id}">حذف</button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="7"><div class="empty-state">مشتری ثبت نشده است.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindActionButtons();
}

function renderAccounting() {
  const income = state.accounting.filter(item => item.type === 'فاکتور فروش').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = state.accounting.filter(item => item.type === 'پرداخت' || item.type === 'فاکتور خرید').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">درآمد</div>
        <div class="kpi-value">${formatMoney(income)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">هزینه</div>
        <div class="kpi-value">${formatMoney(expense)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">خالص</div>
        <div class="kpi-value">${formatMoney(income - expense)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">تعداد اسناد</div>
        <div class="kpi-value">${state.accounting.length}</div>
      </div>
    </div>

    <div class="filter-bar">
      <button class="btn btn-secondary" data-action="accounting-new">ثبت سند جدید</button>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>اسناد حسابداری</h3>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>نوع</th>
              <th>مبلغ</th>
              <th>تاریخ</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${state.accounting.length ? state.accounting.map(item => `
              <tr>
                <td>${item.title}</td>
                <td>${item.type}</td>
                <td>${formatMoney(item.amount)}</td>
                <td>${formatDate(item.date)}</td>
                <td><span class="badge">${item.status}</span></td>
                <td>
                  <div class="inline-actions">
                    <button class="small-btn" data-action="accounting-edit" data-id="${item.id}">ویرایش</button>
                    <button class="small-btn" data-action="accounting-delete" data-id="${item.id}">حذف</button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6"><div class="empty-state">سندی ثبت نشده است.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindActionButtons();
}

function renderKanban() {
  const stageGroups = APP_CONFIG.defaultState.workflowStages.map(stage => ({
    stage,
    items: state.projects.filter(project => project.stage === stage)
  }));

  return `
    <div class="panel">
      <div class="panel-header">
        <h3>برد مراحل پروژه‌ها</h3>
      </div>
      <div class="kanban-board">
        ${stageGroups.map(group => `
          <div class="kanban-column" data-stage="${group.stage}">
            <h3>${group.stage}</h3>
            <div class="kanban-cards">
              ${group.items.length ? group.items.map(project => `
                <div class="kanban-card" draggable="true" data-action="drag-project" data-id="${project.id}">
                  <strong>${project.name}</strong>
                  <div>${project.client}</div>
                  <div>${project.progress}%</div>
                </div>
              `).join('') : '<div class="empty-state">خالی</div>'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  bindKanbanDragAndDrop();
}

function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayIndex = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells = [];

  for (let i = 0; i < startDayIndex; i += 1) {
    cells.push({ outside: true, date: null });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ outside: false, date });
  }

  const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(currentCalendarDate);
  const note = state.notes[getDateKey(new Date(year, month, 1))] || 'یادداشتی ثبت نشده است.';

  return `
    <div class="calendar-layout">
      <div class="panel">
        <div class="calendar-month">
          <button class="small-btn" data-action="calendar-prev">ماه قبل</button>
          <h3>${monthName}</h3>
          <button class="small-btn" data-action="calendar-next">ماه بعد</button>
        </div>
        <div class="calendar-grid">
          <div class="calendar-header-cell">شنبه</div>
          <div class="calendar-header-cell">یکشنبه</div>
          <div class="calendar-header-cell">دوشنبه</div>
          <div class="calendar-header-cell">سه‌شنبه</div>
          <div class="calendar-header-cell">چهارشنبه</div>
          <div class="calendar-header-cell">پنجشنبه</div>
          <div class="calendar-header-cell">جمعه</div>
          ${cells.map(cell => {
            if (!cell.date) return '<div class="calendar-day outside"></div>';
            const key = getDateKey(cell.date);
            const itemCount = (state.projects.filter(p => p.dueDate === key).length + state.crm.filter(p => p.lastContact === key).length);
            const dots = [];
            if (state.projects.some(p => p.dueDate === key)) dots.push('<span class="dot red"></span>');
            if (state.crm.some(p => p.lastContact === key)) dots.push('<span class="dot yellow"></span>');
            if (state.notes[key]) dots.push('<span class="dot green"></span>');
            const isToday = getDateKey(new Date()) === key;
            return `
              <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${key}">
                <strong>${cell.date.getDate()}</strong>
                ${itemCount ? `<div class="dot-list">${dots.join('')}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>یادداشت ماه</h3>
        </div>
        <textarea id="month-note" rows="8">${note}</textarea>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="btn btn-secondary" data-action="save-note">ذخیره یادداشت</button>
        </div>
      </div>
    </div>
  `;

  bindActionButtons();
  bindCalendarCells();
}

function renderReports() {
  const byStage = APP_CONFIG.defaultState.workflowStages.map(stage => {
    const count = state.projects.filter(p => p.stage === stage).length;
    const total = state.projects.length || 1;
    return { label: stage, value: count, percent: Math.round((count / total) * 100) };
  });

  const byType = ['مدرن', 'وب‌اپ', 'CRM', 'برندینگ'].map(type => {
    const count = state.projects.filter(p => p.type === type).length;
    const max = Math.max(...['مدرن', 'وب‌اپ', 'CRM', 'برندینگ'].map(t => state.projects.filter(p => p.type === t).length), 1);
    return { label: type, value: count, percent: Math.round((count / max) * 100) };
  });

  const totalIncome = state.accounting.filter(i => i.type === 'فاکتور فروش').reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpense = state.accounting.filter(i => i.type === 'پرداخت' || i.type === 'فاکتور خرید').reduce((sum, i) => sum + Number(i.amount), 0);

  return `
    <div class="report-grid">
      <div class="report-item">
        <div class="kpi-label">کل درآمد</div>
        <div class="kpi-value">${formatMoney(totalIncome)}</div>
      </div>
      <div class="report-item">
        <div class="kpi-label">کل هزینه</div>
        <div class="kpi-value">${formatMoney(totalExpense)}</div>
      </div>
      <div class="report-item">
        <div class="kpi-label">تعداد پروژه‌ها</div>
        <div class="kpi-value">${state.projects.length}</div>
      </div>
      <div class="report-item">
        <div class="kpi-label">مشتریان</div>
        <div class="kpi-value">${state.crm.length}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-header"><h3>پروژه‌ها بر اساس مرحله</h3></div>
        <div class="bar-stack">
          ${byStage.map(item => `
            <div class="bar-row">
              <span>${item.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${item.percent}%"></div></div>
              <strong>${item.value}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h3>پروژه‌ها بر اساس نوع</h3></div>
        <div class="bar-stack">
          ${byType.map(item => `
            <div class="bar-row">
              <span>${item.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${item.percent}%"></div></div>
              <strong>${item.value}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="settings-grid">
      <div class="panel">
        <div class="panel-header"><h3>تنظیمات کلی</h3></div>
        <div class="field">
          <label>نام شرکت</label>
          <input id="company-name" value="${escapeHtml(state.settings.companyName)}" />
        </div>
        <div class="field" style="margin-top:12px;">
          <label>واحد پول</label>
          <input id="currency-name" value="${escapeHtml(state.settings.currency)}" />
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="btn btn-primary" data-action="save-settings">ذخیره</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h3>پشتیبان‌گیری</h3></div>
        <div class="inline-actions">
          <button class="btn btn-secondary" data-action="export-json">دانلود JSON</button>
          <button class="btn btn-danger" data-action="clear-data">پاک‌سازی داده‌ها</button>
        </div>
        <div class="danger-box" style="margin-top:16px;">
          <strong>توجه:</strong>
          پاک‌سازی داده‌ها، اطلاعات محلی را حذف می‌کند.
        </div>
      </div>
    </div>
  `;

  bindActionButtons();
}

function openProjectModal(projectId = null) {
  const project = projectId ? state.projects.find(item => item.id === Number(projectId)) : null;
  const modalContent = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h2>${project ? 'ویرایش پروژه' : 'پروژه جدید'}</h2>
          <button class="small-btn" data-action="close-modal">بستن</button>
        </div>

        <form id="project-form">
          <input type="hidden" name="id" value="${project ? project.id : ''}" />
          <div class="modal-grid">
            <div class="field">
              <label>نام پروژه</label>
              <input name="name" value="${escapeHtml(project?.name || '')}" required />
            </div>
            <div class="field">
              <label>مشتری</label>
              <input name="client" value="${escapeHtml(project?.client || '')}" required />
            </div>
            <div class="field">
              <label>نوع پروژه</label>
              <select name="type">
                ${['مدرن', 'برندینگ', 'وب‌اپ', 'CRM', 'سایر'].map(type => `<option value="${type}" ${project?.type === type ? 'selected' : ''}>${type}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>مرحله</label>
              <select name="stage">
                ${APP_CONFIG.defaultState.workflowStages.map(stage => `<option value="${stage}" ${project?.stage === stage ? 'selected' : ''}>${stage}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>مسئول</label>
              <input name="owner" value="${escapeHtml(project?.owner || '')}" />
            </div>
            <div class="field">
              <label>پیشرفت (%)</label>
              <input name="progress" type="number" min="0" max="100" value="${project?.progress ?? 0}" />
            </div>
            <div class="field">
              <label>بودجه</label>
              <input name="budget" type="number" value="${project?.budget ?? 0}" />
            </div>
            <div class="field">
              <label>فاکتور</label>
              <input name="invoice" type="number" value="${project?.invoice ?? 0}" />
            </div>
            <div class="field">
              <label>تاریخ تحویل</label>
              <input name="dueDate" type="date" value="${project?.dueDate || ''}" />
            </div>
            <div class="field">
              <label>تاریخ ثبت</label>
              <input name="createdAt" type="date" value="${project?.createdAt || new Date().toISOString().slice(0,10)}" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="close-modal">انصراف</button>
            <button type="submit" class="btn btn-primary">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.innerHTML = modalContent;
  document.getElementById('project-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const data = new FormData(this);
    const payload = {
      id: Number(data.get('id')) || Date.now(),
      name: data.get('name').trim(),
      client: data.get('client').trim(),
      type: data.get('type'),
      stage: data.get('stage'),
      owner: data.get('owner').trim(),
      progress: Number(data.get('progress')) || 0,
      budget: Number(data.get('budget')) || 0,
      invoice: Number(data.get('invoice')) || 0,
      dueDate: data.get('dueDate') || '',
      archived: project?.archived || false,
      createdAt: data.get('createdAt') || new Date().toISOString().slice(0,10)
    };

    if (project) {
      state.projects = state.projects.map(item => item.id === Number(project.id) ? { ...item, ...payload } : item);
      showToast('پروژه با موفقیت بروزرسانی شد.');
    } else {
      state.projects.unshift(payload);
      showToast('پروژه جدید ثبت شد.');
    }

    saveState();
    closeModal();
    renderView(currentView);
  });

  bindActionButtons();
}

function openCRMModal(customerId = null) {
  const customer = customerId ? state.crm.find(item => item.id === Number(customerId)) : null;
  const modalContent = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h2>${customer ? 'ویرایش مشتری' : 'مشتری جدید'}</h2>
          <button class="small-btn" data-action="close-modal">بستن</button>
        </div>

        <form id="crm-form">
          <input type="hidden" name="id" value="${customer ? customer.id : ''}" />
          <div class="modal-grid">
            <div class="field"><label>نام</label><input name="name" value="${escapeHtml(customer?.name || '')}" required /></div>
            <div class="field"><label>شرکت</label><input name="company" value="${escapeHtml(customer?.company || '')}" /></div>
            <div class="field"><label>تلفن</label><input name="phone" value="${escapeHtml(customer?.phone || '')}" /></div>
            <div class="field"><label>مرحله</label><select name="stage">${['جدید', 'تماس اول', 'پیگیری', 'نهایی‌شده', 'ناموفق'].map(stage => `<option value="${stage}" ${customer?.stage === stage ? 'selected' : ''}>${stage}</option>`).join('')}</select></div>
            <div class="field"><label>ارزش</label><input type="number" name="value" value="${customer?.value ?? 0}" /></div>
            <div class="field"><label>تاریخ آخرین تماس</label><input type="date" name="lastContact" value="${customer?.lastContact || new Date().toISOString().slice(0,10)}" /></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" data-action="close-modal">انصراف</button>
            <button class="btn btn-primary" type="submit">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.innerHTML = modalContent;
  document.getElementById('crm-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const data = new FormData(this);
    const payload = {
      id: Number(data.get('id')) || Date.now(),
      name: data.get('name').trim(),
      company: data.get('company').trim(),
      phone: data.get('phone').trim(),
      stage: data.get('stage'),
      value: Number(data.get('value')) || 0,
      lastContact: data.get('lastContact') || new Date().toISOString().slice(0,10)
    };

    if (customer) {
      state.crm = state.crm.map(item => item.id === Number(customer.id) ? { ...item, ...payload } : item);
      showToast('مشتری با موفقیت بروزرسانی شد.');
    } else {
      state.crm.unshift(payload);
      showToast('مشتری جدید اضافه شد.');
    }

    saveState();
    closeModal();
    renderView(currentView);
  });
}

function openAccountingModal(entryId = null) {
  const entry = entryId ? state.accounting.find(item => item.id === Number(entryId)) : null;
  const modalContent = `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h2>${entry ? 'ویرایش سند' : 'ثبت سند'}</h2>
          <button class="small-btn" data-action="close-modal">بستن</button>
        </div>

        <form id="accounting-form">
          <input type="hidden" name="id" value="${entry ? entry.id : ''}" />
          <div class="modal-grid">
            <div class="field"><label>عنوان</label><input name="title" value="${escapeHtml(entry?.title || '')}" required /></div>
            <div class="field"><label>نوع</label><select name="type">${['فاکتور فروش', 'فاکتور خرید', 'دریافت', 'پرداخت'].map(type => `<option value="${type}" ${entry?.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>
            <div class="field"><label>مبلغ</label><input type="number" name="amount" value="${entry?.amount ?? 0}" required /></div>
            <div class="field"><label>تاریخ</label><input type="date" name="date" value="${entry?.date || new Date().toISOString().slice(0,10)}" required /></div>
            <div class="field"><label>وضعیت</label><select name="status"><option value="دریافت شده" ${entry?.status === 'دریافت شده' ? 'selected' : ''}>دریافت شده</option><option value="انجام شده" ${entry?.status === 'انجام شده' ? 'selected' : ''}>انجام شده</option><option value="در انتظار" ${entry?.status === 'در انتظار' ? 'selected' : ''}>در انتظار</option></select></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" data-action="close-modal">انصراف</button>
            <button class="btn btn-primary" type="submit">ذخیره</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.innerHTML = modalContent;
  document.getElementById('accounting-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const data = new FormData(this);
    const payload = {
      id: Number(data.get('id')) || Date.now(),
      title: data.get('title').trim(),
      type: data.get('type'),
      amount: Number(data.get('amount')) || 0,
      date: data.get('date'),
      status: data.get('status')
    };

    if (entry) {
      state.accounting = state.accounting.map(item => item.id === Number(entry.id) ? { ...item, ...payload } : item);
      showToast('سند با موفقیت بروزرسانی شد.');
    } else {
      state.accounting.unshift(payload);
      showToast('سند جدید ثبت شد.');
    }

    saveState();
    closeModal();
    renderView(currentView);
  });
}

function closeModal() {
  modalRoot.innerHTML = '';
}

function bindProjectFilters() {
  const search = document.getElementById('project-search');
  const stage = document.getElementById('project-stage-filter');

  search?.addEventListener('input', () => renderView('projects'));
  stage?.addEventListener('change', () => renderView('projects'));
}

function bindKanbanDragAndDrop() {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', card.dataset.id);
    });
  });

  document.querySelectorAll('.kanban-column').forEach(column => {
    column.addEventListener('dragover', event => event.preventDefault());
    column.addEventListener('drop', event => {
      event.preventDefault();
      const projectId = Number(event.dataTransfer.getData('text/plain'));
      const newStage = column.dataset.stage;
      state.projects = state.projects.map(project => project.id === projectId ? { ...project, stage: newStage } : project);
      saveState();
      renderView('kanban');
    });
  });
}

function bindCalendarCells() {
  document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
    day.addEventListener('click', () => {
      const date = day.dataset.date;
      alert(state.notes[date] || 'برای این روز یادداشتی ثبت نشده است.');
    });
  });
}

function bindActionButtons() {
  document.querySelectorAll('[data-action]').forEach(button => {
    const action = button.dataset.action;
    button.onclick = () => {
      if (action === 'close-modal') closeModal();
      if (action === 'project-new') openProjectModal();
      if (action === 'project-edit') openProjectModal(button.dataset.id);
      if (action === 'project-delete') {
        state.projects = state.projects.filter(item => item.id !== Number(button.dataset.id));
        saveState();
        renderView('projects');
      }
      if (action === 'crm-new') openCRMModal();
      if (action === 'crm-edit') openCRMModal(button.dataset.id);
      if (action === 'crm-delete') {
        state.crm = state.crm.filter(item => item.id !== Number(button.dataset.id));
        saveState();
        renderView('crm');
      }
      if (action === 'accounting-new') openAccountingModal();
      if (action === 'accounting-edit') openAccountingModal(button.dataset.id);
      if (action === 'accounting-delete') {
        state.accounting = state.accounting.filter(item => item.id !== Number(button.dataset.id));
        saveState();
        renderView('accounting');
      }
      if (action === 'calendar-prev') {
        currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
        renderView('calendar');
      }
      if (action === 'calendar-next') {
        currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
        renderView('calendar');
      }
      if (action === 'save-note') {
        const note = document.getElementById('month-note')?.value || '';
        state.notes[getDateKey(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1))] = note;
        saveState();
        showToast('یادداشت ثبت شد.');
      }
      if (action === 'save-settings') {
        state.settings.companyName = document.getElementById('company-name')?.value || state.settings.companyName;
        state.settings.currency = document.getElementById('currency-name')?.value || state.settings.currency;
        saveState();
        showToast('تنظیمات ذخیره شد.');
      }
      if (action === 'export-json') {
        exportBackup();
      }
      if (action === 'clear-data') {
        if (confirm('آیا مطمئن هستید؟ همه داده‌های محلی حذف می‌شود.')) {
          localStorage.removeItem(APP_CONFIG.storageKey);
          Object.assign(state, JSON.parse(JSON.stringify(APP_CONFIG.defaultState)));
          saveState();
          renderView('dashboard');
          showToast('داده‌ها پاک شدند.');
        }
      }
    };
  });
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chargosh-backup.json';
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

navButtons.forEach(button => {
  button.addEventListener('click', () => renderView(button.dataset.view));
});

exportBtn.addEventListener('click', exportBackup);
primaryActionBtn.addEventListener('click', () => openProjectModal());

renderView('dashboard');
