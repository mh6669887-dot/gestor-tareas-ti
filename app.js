/* ── Auth guard ── */
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
if (!currentUser) window.location.href = 'index.html';

document.getElementById('headerUser').textContent = currentUser ? currentUser.name : '';

function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

/* ── Storage ── */
const STORAGE_KEY = 'gestor_tareas_v1';

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* ── State ── */
let tasks = loadTasks();
let activeFilter = 'todas';
let pendingDeleteId = null;

/* ── Render ── */
function render() {
  updateStats();
  renderTasks();
}

function updateStats() {
  const total      = tasks.length;
  const pendiente  = tasks.filter(t => t.status === 'pendiente').length;
  const en_proceso = tasks.filter(t => t.status === 'en_proceso').length;
  const terminada  = tasks.filter(t => t.status === 'terminada').length;
  const pct        = total ? Math.round((terminada / total) * 100) : 0;

  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statPendiente').textContent = pendiente;
  document.getElementById('statProceso').textContent   = en_proceso;
  document.getElementById('statTerminada').textContent = terminada;
  document.getElementById('progressPercent').textContent = pct + '%';
  document.getElementById('progressBar').style.width    = pct + '%';
}

function renderTasks() {
  const container  = document.getElementById('tasksContainer');
  const emptyState = document.getElementById('emptyState');

  const filtered = activeFilter === 'todas'
    ? tasks
    : tasks.filter(t => t.status === activeFilter);

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  container.innerHTML = filtered
    .slice()
    .sort((a, b) => {
      const order = { alta: 0, media: 1, baja: 2 };
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    })
    .map(taskCard)
    .join('');
}

function taskCard(t) {
  const statusLabel = { pendiente: 'Pendiente', en_proceso: 'En proceso', terminada: 'Terminada' };
  const priorityLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' };

  const today = new Date().toISOString().split('T')[0];
  const overdue = t.dueDate && t.dueDate < today && t.status !== 'terminada';

  return `
  <div class="task-card status-${t.status}">
    <div class="task-top">
      <span class="task-title">${escHtml(t.title)}</span>
      <span class="badge badge-${t.status}">${statusLabel[t.status]}</span>
    </div>
    ${t.description ? `<p class="task-desc">${escHtml(t.description)}</p>` : ''}
    <div class="task-meta">
      ${t.responsible ? `
        <span class="task-meta-item">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
          </svg>
          ${escHtml(t.responsible)}
        </span>` : ''}
      ${t.dueDate ? `
        <span class="task-meta-item ${overdue ? 'overdue' : ''}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12"/>
          </svg>
          ${formatDate(t.dueDate)}${overdue ? ' · vencida' : ''}
        </span>` : ''}
    </div>
    <div class="task-footer">
      <span class="task-priority">
        <span class="badge badge-${t.priority}">${priorityLabel[t.priority]}</span>
      </span>
      <div class="task-actions">
        <button class="icon-btn" onclick="openModal('${t.id}')" title="Editar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
          </svg>
        </button>
        <button class="icon-btn delete" onclick="confirmDelete('${t.id}')" title="Eliminar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/>
          </svg>
        </button>
      </div>
    </div>
  </div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/* ── Filters ── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTasks();
  });
});

/* ── Modal ── */
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
    document.getElementById('modalTitle').textContent   = 'Editar tarea';
    document.getElementById('submitBtn').textContent    = 'Guardar cambios';
    document.getElementById('taskId').value             = t.id;
    document.getElementById('taskTitle').value          = t.title;
    document.getElementById('taskDesc').value           = t.description || '';
    document.getElementById('taskStatus').value         = t.status;
    document.getElementById('taskResponsible').value    = t.responsible || '';
    document.getElementById('taskDate').value           = t.dueDate || '';
    document.getElementById('taskPriority').value       = t.priority;
  }

  modal.classList.remove('hidden');
  document.getElementById('taskTitle').focus();
}

function closeModal() { modal.classList.add('hidden'); }

function closeModalOutside(e) { if (e.target === modal) closeModal(); }

taskForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const id    = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) return;

  const data = {
    title,
    description:  document.getElementById('taskDesc').value.trim(),
    status:       document.getElementById('taskStatus').value,
    responsible:  document.getElementById('taskResponsible').value.trim(),
    dueDate:      document.getElementById('taskDate').value,
    priority:     document.getElementById('taskPriority').value,
  };

  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx !== -1) tasks[idx] = { ...tasks[idx], ...data };
  } else {
    tasks.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...data });
  }

  saveTasks(tasks);
  closeModal();
  render();
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
  render();
});

/* ── Init ── */
render();
