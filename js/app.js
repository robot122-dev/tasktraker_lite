var API_URL = '/api/tasks';
var tasks = [];
var currentFilter = 'all';
var searchQuery = '';

async function fetchTasks() {
    var url = API_URL;
    if (currentFilter && currentFilter !== 'all') {
        url += '?status=' + currentFilter;
    }
    var res = await fetch(url);
    tasks = await res.json();
    renderTasks();
}

async function fetchSearch(query) {
    if (!query) {
        return fetchTasks();
    }
    var res = await fetch(API_URL + '/search?query=' + encodeURIComponent(query));
    tasks = await res.json();
    renderTasks();
}

function renderTasks() {
    var container = document.getElementById('taskContainer');
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.appendChild(createEmptyMessage());
        return;
    }

    tasks.forEach(function (task) {
        container.appendChild(createTaskElement(task));
    });
}

function createEmptyMessage() {
    var p = document.createElement('p');
    p.className = 'empty-message';
    p.textContent = 'Задач пока нет. Добавьте первую задачу!';
    return p;
}

function createTaskElement(task) {
    var div = document.createElement('div');
    div.className = 'task-item';
    div.setAttribute('data-id', task.id);

    div.innerHTML =
        '<div class="task-content">' +
            '<div class="task-title">' + escapeHtml(task.title) + '</div>' +
            (task.description ? '<div class="task-description">' + escapeHtml(task.description) + '</div>' : '') +
            '<div class="task-meta">' +
                '<span class="task-status status-' + task.status + '">' + getStatusLabel(task.status) + '</span>' +
                '<span class="priority-' + task.priority + '">' + getPriorityLabel(task.priority) + '</span>' +
                '<span>' + formatDate(task.createdAt) + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="task-actions">' +
            '<button class="btn-status" onclick="handleStatusChange(' + task.id + ')">Сменить статус</button>' +
            '<button class="btn-delete" onclick="handleDelete(' + task.id + ')">Удалить</button>' +
        '</div>';

    return div;
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function formatDate(isoString) {
    var date = new Date(isoString);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    return day + '.' + month + '.' + year;
}

function getStatusLabel(status) {
    var labels = { todo: 'К выполнению', in_progress: 'В работе', done: 'Выполнено' };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    var labels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
    return labels[priority] || priority;
}

async function handleAddTask(e) {
    e.preventDefault();
    var titleInput = document.getElementById('taskTitle');
    var descInput = document.getElementById('taskDescription');
    var priorityInput = document.getElementById('taskPriority');

    var title = titleInput.value.trim();
    if (!title) return;

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title,
            description: descInput.value,
            priority: priorityInput.value
        })
    });

    titleInput.value = '';
    descInput.value = '';
    priorityInput.value = 'medium';
    fetchTasks();
}

async function handleDelete(taskId) {
    await fetch(API_URL + '/' + taskId, { method: 'DELETE' });
    fetchTasks();
}

async function handleStatusChange(taskId) {
    var task = tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;
    var order = ['todo', 'in_progress', 'done'];
    var idx = order.indexOf(task.status);
    var next = (idx === -1 || idx === order.length - 1) ? 'todo' : order[idx + 1];
    await fetch(API_URL + '/' + taskId + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
    });
    fetchTasks();
}

function handleFilter(e) {
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    fetchTasks();
}

var searchTimeout;
function handleSearch(e) {
    clearTimeout(searchTimeout);
    searchQuery = e.target.value;
    searchTimeout = setTimeout(function () {
        fetchSearch(searchQuery);
    }, 300);
}

document.getElementById('taskForm').addEventListener('submit', handleAddTask);
document.getElementById('searchInput').addEventListener('input', handleSearch);
document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', handleFilter);
});

fetchTasks();
