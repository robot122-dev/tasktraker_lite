var tasks = loadTasks();
var currentFilter = 'all';
var searchQuery = '';

function renderTasks() {
    var container = document.getElementById('taskContainer');
    var emptyMessage = document.getElementById('emptyMessage');

    var filtered = filterTasks(tasks, currentFilter);
    filtered = searchTasks(filtered, searchQuery);

    container.innerHTML = '';

    if (filtered.length === 0) {
        container.appendChild(createEmptyMessage());
        return;
    }

    filtered.forEach(function (task) {
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
            '<button class="btn-status" onclick="handleStatusChange(\'' + task.id + '\')">Сменить статус</button>' +
            '<button class="btn-delete" onclick="handleDelete(\'' + task.id + '\')">Удалить</button>' +
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

function handleAddTask(e) {
    e.preventDefault();
    var titleInput = document.getElementById('taskTitle');
    var descInput = document.getElementById('taskDescription');
    var priorityInput = document.getElementById('taskPriority');

    var title = titleInput.value.trim();
    if (!title) {
        return;
    }

    addTask(tasks, title, descInput.value, priorityInput.value);
    saveTasks(tasks);
    renderTasks();

    titleInput.value = '';
    descInput.value = '';
    priorityInput.value = 'medium';
}

function handleDelete(taskId) {
    deleteTask(tasks, taskId);
    saveTasks(tasks);
    renderTasks();
}

function handleStatusChange(taskId) {
    changeStatus(tasks, taskId);
    saveTasks(tasks);
    renderTasks();
}

function handleFilter(e) {
    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function (btn) {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderTasks();
}

function handleSearch(e) {
    searchQuery = e.target.value;
    renderTasks();
}

document.getElementById('taskForm').addEventListener('submit', handleAddTask);
document.getElementById('searchInput').addEventListener('input', handleSearch);

document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', handleFilter);
});

renderTasks();
