const API_USER = '/api/users';
const API_TASK = '/api/tasks';
const API_NOTIF = '/api/notifications';

let users = [];
let tasks = [];
let notifications = [];
let currentFilter = 'all';

// --- Health check ---
async function checkServices() {
    try {
        const res = await fetch('/api/users/health');
        document.getElementById('statusUser').className = 'status-dot ok';
    } catch { document.getElementById('statusUser').className = 'status-dot err'; }
    try {
        const res = await fetch('/api/tasks/health');
        document.getElementById('statusTask').className = 'status-dot ok';
    } catch { document.getElementById('statusTask').className = 'status-dot err'; }
    try {
        const res = await fetch('/api/notifications/health');
        document.getElementById('statusNotif').className = 'status-dot ok';
    } catch { document.getElementById('statusNotif').className = 'status-dot err'; }
}

// --- Users ---
async function loadUsers() {
    try {
        const res = await fetch(API_USER);
        users = await res.json();
    } catch { users = []; }
    renderUsers();
    updateUserSelect();
}

function renderUsers() {
    const el = document.getElementById('userList');
    document.getElementById('userCount').textContent = users.length;
    if (users.length === 0) { el.innerHTML = '<div class="empty">Пользователей нет</div>'; return; }
    el.innerHTML = users.map(u => `
        <div class="item">
            <div class="item-info">
                <div class="item-name">${esc(u.name)}</div>
                <div class="item-meta">${esc(u.email)} · ID: ${u.id}</div>
            </div>
            <div class="item-actions">
                <button class="btn-delete" onclick="deleteUser(${u.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

function updateUserSelect() {
    const sel = document.getElementById('taskUser');
    sel.innerHTML = '<option value="">Без пользователя</option>' +
        users.map(u => `<option value="${u.id}">${esc(u.name)} (ID:${u.id})</option>`).join('');
}

async function addUser(e) {
    e.preventDefault();
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    if (!name || !email) return;
    await fetch(API_USER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
    });
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    loadUsers();
}

async function deleteUser(id) {
    await fetch(`${API_USER}/${id}`, { method: 'DELETE' });
    loadUsers();
}

// --- Tasks ---
async function loadTasks() {
    try {
        let url = API_TASK;
        if (currentFilter !== 'all') url += '?status=' + currentFilter;
        const res = await fetch(url);
        tasks = await res.json();
    } catch { tasks = []; }
    renderTasks();
}

function renderTasks() {
    const el = document.getElementById('taskList');
    document.getElementById('taskCount').textContent = tasks.length;
    if (tasks.length === 0) { el.innerHTML = '<div class="empty">Задач нет</div>'; return; }
    const statusLabels = { todo: 'К выполнению', in_progress: 'В работе', done: 'Выполнено' };
    el.innerHTML = tasks.map(t => `
        <div class="item">
            <div class="item-info">
                <div class="item-name">${esc(t.title)}</div>
                <div class="item-meta">
                    <span class="status-badge status-${t.status}">${statusLabels[t.status] || t.status}</span>
                    <span class="priority-${t.priority}">${t.priority}</span>
                    ${t.user_id ? '· User ID: ' + t.user_id : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-status" onclick="changeTaskStatus(${t.id}, '${t.status}')">Статус</button>
                <button class="btn-delete" onclick="deleteTask(${t.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

async function addTask(e) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return;
    const body = {
        title,
        description: document.getElementById('taskDesc').value.trim(),
        priority: document.getElementById('taskPriority').value
    };
    const userId = document.getElementById('taskUser').value;
    if (userId) body.user_id = parseInt(userId);
    await fetch(API_TASK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    loadTasks();
    setTimeout(loadNotifications, 500);
}

async function changeTaskStatus(id, current) {
    const order = ['todo', 'in_progress', 'done'];
    const next = order[(order.indexOf(current) + 1) % 3];
    await fetch(`${API_TASK}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
    });
    loadTasks();
    setTimeout(loadNotifications, 500);
}

async function deleteTask(id) {
    await fetch(`${API_TASK}/${id}`, { method: 'DELETE' });
    loadTasks();
}

// --- Notifications ---
async function loadNotifications() {
    try {
        const res = await fetch(API_NOTIF);
        notifications = await res.json();
    } catch { notifications = []; }
    renderNotifications();
}

function renderNotifications() {
    const el = document.getElementById('notifList');
    document.getElementById('notifCount').textContent = notifications.filter(n => !n.read).length;
    if (notifications.length === 0) { el.innerHTML = '<div class="empty">Уведомлений нет</div>'; return; }
    el.innerHTML = notifications.map(n => `
        <div class="item ${n.read ? 'notif-read' : 'notif-unread'}">
            <div class="item-info">
                <div class="item-name">${esc(n.message)}</div>
                <div class="item-meta">User: ${n.user_id} · ${n.type} · ${new Date(n.created_at).toLocaleString()}</div>
            </div>
            <div class="item-actions">
                ${!n.read ? `<button class="btn-read" onclick="markRead(${n.id})">Прочитано</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function markRead(id) {
    await fetch(`${API_NOTIF}/${id}/read`, { method: 'PATCH' });
    loadNotifications();
}

// --- Utils ---
function esc(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }

// --- Filters ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        loadTasks();
    });
});

// --- Init ---
document.getElementById('userForm').addEventListener('submit', addUser);
document.getElementById('taskForm').addEventListener('submit', addTask);

checkServices();
loadUsers();
loadTasks();
loadNotifications();
setInterval(checkServices, 10000);
