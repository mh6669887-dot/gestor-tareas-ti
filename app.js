'use strict';

/* ── Auth guard ── */
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
if (!currentUser) window.location.href = 'index.html';

const isAdmin  = currentUser.role === 'admin';
const isWorker = currentUser.role === 'worker';

document.getElementById('headerUser').textContent      = currentUser.name;
document.getElementById('headerRoleBadge').textContent = isAdmin ? 'Administrador' : 'Colaborador';
document.getElementById('headerRoleBadge').className   = 'role-badge ' + (isAdmin ? 'role-admin' : 'role-worker');

function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

/* ── Storage ── */
const STORAGE_KEY = 'gestor_tareas_v2';

const MEMBERS = [
  { username: 'gustavo', name: 'Gustavo Alean',  initials: 'GA', color: '#1A3560' },
  { username: 'lucas',   name: 'Lucas Triana',   initials: 'LT', color: '#2563EB' },
  { username: 'daniela', name: 'Daniela Acosta', initials: 'DA', color: '#7C3AED' },
];

function getMember(username) {
  return MEMBERS.find(m => m.username === username) || { name: username, initials: '?', color: '#64748B' };
}

function seedTasks() {
  return [
    { id: '1', title: 'Levantamiento de requisitos', description: 'Documentar los requisitos funcionales y no funcionales de la aplicación web con el equipo.', status: 'terminada', priority: 'alta', assignedTo: 'gustavo', dueDate: '2026-10-15', createdAt: '2026-10-01T10:00:00Z' },
    { id: '2', title: 'Diseño de wireframes y prototipo UI', description: 'Crear prototipos de baja fidelidad de las pantallas principales: login y panel de tareas.', status: 'terminada', priority: 'alta', assignedTo: 'daniela', dueDate: '2026-10-20', createdAt: '2026-10-05T09:00:00Z' },
    { id: '3', title: 'Implementar sistema de login', description: 'Desarrollar la pantalla de inicio de sesión con validación de credenciales y control de sesión.', status: 'terminada', priority: 'alta', assignedTo: 'lucas', dueDate: '2026-10-25', createdAt: '2026-10-10T08:00:00Z' },
    { id: '4', title: 'Desarrollar CRUD de tareas', description: 'Implementar las operaciones crear, leer, actualizar y eliminar tareas en la aplicación.', status: 'terminada', priority: 'alta', assignedTo: 'lucas', dueDate: '2026-11-01', createdAt: '2026-10-15T08:00:00Z' },
    { id: '5', title: 'Redactar documento de cierre', description: 'Elaborar el documento de cierre del proyecto con todos los puntos requeridos en la rúbrica de la asignatura.', status: 'en_proceso', priority: 'alta', assignedTo: 'daniela', dueDate: '2026-11-15', createdAt: '2026-11-01T10:00:00Z' },
    { id: '6', title: 'Despliegue en GitHub Pages', description: 'Configurar el repositorio público y activar GitHub Pages para publicar la aplicación.', status: 'terminada', priority: 'media', assignedTo: 'lucas', dueDate: '2026-11-05', createdAt: '2026-10-28T08:00:00Z' },
    { id: '7', title: 'Preparar presentación de cierre', description: 'Crear las diapositivas y el guión para la exposición del documento de cierre del proyecto.', status: 'en_proceso', priority: 'alta', assignedTo: 'daniela', dueDate: '2026-11-14', createdAt: '2026-11-08T09:00:00Z' },
    { id: '8', title: 'Revisión del cronograma final', description: 'Verificar y documentar las variaciones del cronograma respecto al plan original del proyecto.', status: 'pendiente', priority: 'media', assignedTo: 'gustavo', dueDate: '2026-11-13', createdAt: '2026-11-09T10:00:00Z' },
    { id: '9', title: 'Pruebas funcionales de la aplicación', description: 'Ejecutar las pruebas funcionales de todas las pantallas y documentar los resultados obtenidos.', status: 'terminada', priority: 'alta', assignedTo: 'daniela', dueDate: '2026-11-08', createdAt: '2026-11-02T09:00:00Z' },
    { id: '10', title: 'Control de versiones y merge final', description: 'Revisar el historial de commits, resolver conflictos y hacer el merge final al branch principal.', status: 'terminada', priority: 'media', assignedTo: 'lucas', dueDate: '2026-11-10', createdAt: '2026-11-05T08:00:00Z' },
    { id: '11', title: 'Informe de situación final del proyecto', description: 'Redactar el informe de situación evaluando alcance, riesgos, conflictos, sobrecostos y formación.', status: 'pendiente', priority: 'media', assignedTo: 'gustavo', dueDate: '2026-11-14', createdAt: '2026-11-10T10:00:00Z' },
  ];
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    const seed = seedTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch { return seedTasks(); }
}

function saveTasks(t) { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); }

/* ── State ── */
let tasks           = loadTasks();
let activeFilter    = 'all';
let activeStatus    = 'todas';
let activeWStatus   = 'todas';
let pendingDeleteId = null;

/* ── Helpers ── */
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(iso) {
  if (!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function isOverdue(t) {
  if (!t.dueDate || t.status === 'terminada') return false;
  return t.dueDate < new Date().toISOString().split('T')[0];
}

/* ════════════════════════════════
   ADMIN
════════════════════════════════ */
function renderAdmin() {
  const v = document.getElementById('adminView');
  v.classList.remove('hidden');

  renderAdminStats();
  renderMemberStats();
  renderAdminTasks();
}

function renderAdminStats() {
  const total     = tasks.length;
  const pendiente = tasks.filter(t => t.status === 'pendiente').length;
  const proceso   = tasks.filter(t => t.status === 'en_proceso').length;
  const terminada = tasks.filter(t => t.status === 'terminada').length;
  const pct       = total ? Math.round((terminada / total) * 100) : 0;

  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statPendiente').textContent = pendiente;
  document.getElementById('statProceso').textContent   = proceso;
  document.getElementById('statTerminada').textContent = terminada;
  document.getElementById('progressPercent').textContent = pct + '%';
  document.getElementById('progressBar').style.width    = pct + '%';
}

function renderMemberStats() {
  const container = document.getElementById('memberStats');
  container.innerHTML = MEMBERS.map(m => {
    const mt  = tasks.filter(t => t.assignedTo === m.username);
    const done = mt.filter(t => t.status === 'terminada').length;
    const pct  = mt.length ? Math.round((done / mt.length) * 100) : 0;
    const pend = mt.filter(t => t.status === 'pendiente').length;
    const proc = mt.filter(t => t.status === 'en_proceso').length;
    return `
    <div class="member-card">
      <div class="member-avatar" style="background:${m.color}">${m.initials}</div>
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-counts">
          <span class="mc pending">${pend} pendiente${pend !== 1 ? 's' : ''}</span>
          <span class="mc inprog">${proc} en proceso</span>
          <span class="mc done">${done} terminada${done !== 1 ? 's' : ''}</span>
        </div>
        <div class="member-bar-track">
          <div class="member-bar-fill" style="width:${pct}%;background:${m.color}"></div>
        </div>
      </div>
      <div class="member-pct">${pct}%</div>
    </div>`;
  }).join('');
}

function getFilteredTasks() {
  return tasks.filter(t => {
    const memberMatch = activeFilter === 'all' || t.assignedTo === activeFilter;
    const statusMatch = activeStatus === 'todas' || t.status === activeStatus;
    return memberMatch && statusMatch;
  });
}

function renderAdminTasks() {
  const container  = document.getElementById('tasksContainer');
  const emptyState = document.getElementById('emptyState');
  const filtered   = getFilteredTasks()
    .sort((a, b) => {
      const p = { alta:0, media:1, baja:2 };
      return (p[a.priority]??1) - (p[b.priority]??1);
    });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  container.innerHTML = filtered.map(adminTaskCard).join('');
}

function adminTaskCard(t) {
  const m = getMember(t.assignedTo);
  const statusLabel = { pendiente:'Pendiente', en_proceso:'En proceso', terminada:'Terminada' };
  const priLabel    = { alta:'Alta', media:'Media', baja:'Baja' };
  const overdue = isOverdue(t);
  return `
  <div class="task-card status-${t.status}">
    <div class="task-top">
      <span class="task-title">${escHtml(t.title)}</span>
      <span class="badge badge-${t.status}">${statusLabel[t.status]}</span>
    </div>
    ${t.description ? `<p class="task-desc">${escHtml(t.description)}</p>` : ''}
    <div class="task-meta">
      <span class="task-meta-item assignee-chip" style="--ac:${m.color}">
        <span class="assignee-dot" style="background:${m.color}">${m.initials}</span>
        ${escHtml(m.name)}
      </span>
      ${t.dueDate ? `<span class="task-meta-item ${overdue?'overdue':''}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12"/></svg>
        ${formatDate(t.dueDate)}${overdue?' · vencida':''}
      </span>` : ''}
    </div>
    <div class="task-footer">
      <span class="badge badge-${t.priority}">${priLabel[t.priority]}</span>
      <div class="task-actions">
        <button class="icon-btn" onclick="openModal('${t.id}')" title="Editar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
        </button>
        <button class="icon-btn delete" onclick="confirmDelete('${t.id}')" title="Eliminar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

/* ── Admin filters ── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderAdminTasks();
  });
});

document.querySelectorAll('.status-btn[data-status]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.status-btn[data-status]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.dataset.status;
    renderAdminTasks();
  });
});

/* ── Admin modal ── */
const modal    = document.getElementById('modal');
const taskForm = document.getElementById('taskForm');

function openModal(id) {
  taskForm.reset();
  document.getElementById('taskId').value = '';
  document.getElementById('modalTitle').textContent = 'Nueva tarea';
  document.getElementById('submitBtn').textContent  = 'Guardar tarea';

  if (id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    document.getElementById('modalTitle').textContent  = 'Editar tarea';
    document.getElementById('submitBtn').textContent   = 'Guardar cambios';
    document.getElementById('taskId').value            = t.id;
    document.getElementById('taskTitle').value         = t.title;
    document.getElementById('taskDesc').value          = t.description || '';
    document.getElementById('taskStatus').value        = t.status;
    document.getElementById('taskAssignee').value      = t.assignedTo || '';
    document.getElementById('taskDate').value          = t.dueDate || '';
    document.getElementById('taskPriority').value      = t.priority;
  }

  modal.classList.remove('hidden');
  document.getElementById('taskTitle').focus();
}

function closeModal() { modal.classList.add('hidden'); }
function closeModalOutside(e) { if (e.target === modal) closeModal(); }

taskForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const id    = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) return;

  const assignedTo   = document.getElementById('taskAssignee').value;
  const data = {
    title,
    description: document.getElementById('taskDesc').value.trim(),
    status:      document.getElementById('taskStatus').value,
    assignedTo,
    dueDate:     document.getElementById('taskDate').value,
    priority:    document.getElementById('taskPriority').value,
  };

  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) tasks[idx] = { ...tasks[idx], ...data };
  } else {
    tasks.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...data });
  }

  saveTasks(tasks);
  closeModal();
  renderAdmin();
});

/* ── Delete confirm ── */
const confirmOverlay = document.getElementById('confirmOverlay');

function confirmDelete(id) {
  pendingDeleteId = id;
  confirmOverlay.classList.remove('hidden');
}
function closeConfirm() {
  pendingDeleteId = null;
  confirmOverlay.classList.add('hidden');
}
function closeConfirmOutside(e) { if (e.target === confirmOverlay) closeConfirm(); }

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (!pendingDeleteId) return;
  tasks = tasks.filter(t => t.id !== pendingDeleteId);
  saveTasks(tasks);
  closeConfirm();
  renderAdmin();
});

/* ════════════════════════════════
   WORKER
════════════════════════════════ */
function renderWorker() {
  const v = document.getElementById('workerView');
  v.classList.remove('hidden');

  const member = getMember(currentUser.username);
  const pend   = tasks.filter(t => t.assignedTo === currentUser.username && t.status === 'pendiente').length;

  document.getElementById('workerGreeting').textContent = `Hola, ${currentUser.name.split(' ')[0]} 👋`;
  document.getElementById('workerSub').textContent      = pend > 0
    ? `Tienes ${pend} tarea${pend > 1 ? 's' : ''} pendiente${pend > 1 ? 's' : ''}`
    : 'Estás al día con todas tus tareas';
  document.getElementById('workerAvatar').textContent   = member.initials;
  document.getElementById('workerAvatar').style.background = member.color;

  renderWorkerStats();
  renderWorkerTasks();
}

function getMyTasks() {
  return tasks.filter(t => {
    const mine   = t.assignedTo === currentUser.username;
    const status = activeWStatus === 'todas' || t.status === activeWStatus;
    return mine && status;
  });
}

function renderWorkerStats() {
  const mine = tasks.filter(t => t.assignedTo === currentUser.username);
  const pend = mine.filter(t => t.status === 'pendiente').length;
  const proc = mine.filter(t => t.status === 'en_proceso').length;
  const done = mine.filter(t => t.status === 'terminada').length;
  const pct  = mine.length ? Math.round((done / mine.length) * 100) : 0;

  document.getElementById('wStatPendiente').textContent = pend;
  document.getElementById('wStatProceso').textContent   = proc;
  document.getElementById('wStatTerminada').textContent = done;
  document.getElementById('wStatTotal').textContent     = mine.length;
  document.getElementById('wProgressPercent').textContent = pct + '%';
  document.getElementById('wProgressBar').style.width    = pct + '%';
}

function renderWorkerTasks() {
  const container  = document.getElementById('workerTasksContainer');
  const emptyState = document.getElementById('workerEmptyState');
  const filtered   = getMyTasks()
    .sort((a, b) => {
      const p = { alta:0, media:1, baja:2 };
      const sp = { pendiente:0, en_proceso:1, terminada:2 };
      if (sp[a.status] !== sp[b.status]) return sp[a.status] - sp[b.status];
      return (p[a.priority]??1) - (p[b.priority]??1);
    });

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  container.innerHTML = filtered.map(workerTaskRow).join('');
}

function workerTaskRow(t) {
  const statusLabel = { pendiente:'Pendiente', en_proceso:'En proceso', terminada:'Terminada' };
  const priLabel    = { alta:'Alta', media:'Media', baja:'Baja' };
  const overdue = isOverdue(t);

  const nextBtn = t.status === 'pendiente'
    ? `<button class="status-action-btn start" onclick="changeStatus('${t.id}','en_proceso')">▶ Iniciar</button>`
    : t.status === 'en_proceso'
    ? `<button class="status-action-btn done" onclick="changeStatus('${t.id}','terminada')">✔ Marcar terminada</button>`
    : `<span class="status-done-label">✔ Completada</span>`;

  return `
  <div class="worker-task-row status-${t.status}">
    <div class="wtr-left">
      <div class="wtr-priority-dot priority-${t.priority}"></div>
      <div class="wtr-body">
        <div class="wtr-title ${t.status === 'terminada' ? 'done-text' : ''}">${escHtml(t.title)}</div>
        ${t.description ? `<div class="wtr-desc">${escHtml(t.description)}</div>` : ''}
        <div class="wtr-meta">
          <span class="badge badge-${t.status}">${statusLabel[t.status]}</span>
          <span class="badge badge-${t.priority}">${priLabel[t.priority]}</span>
          ${t.dueDate ? `<span class="wtr-date ${overdue?'overdue':''}">
            📅 ${formatDate(t.dueDate)}${overdue?' · vencida':''}
          </span>` : ''}
        </div>
      </div>
    </div>
    <div class="wtr-actions">${nextBtn}</div>
  </div>`;
}

function changeStatus(id, newStatus) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks[idx].status = newStatus;
  saveTasks(tasks);
  renderWorker();
}

/* ── Worker filters ── */
document.querySelectorAll('.status-btn[data-wstatus]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.status-btn[data-wstatus]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeWStatus = btn.dataset.wstatus;
    renderWorkerTasks();
  });
});

/* ── Boot ── */
if (isAdmin)  renderAdmin();
if (isWorker) renderWorker();
