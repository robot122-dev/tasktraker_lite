class TaskManager {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
        this._loadFromStorage();
    }

    // Нарушение SRP: хранение + создание + редактирование + удаление + генерация HTML + уведомления + поиск + фильтрация
    // Всё в одном классе

    addTask(title, description, priority, status) {
        if (!title) {
            this.showNotification('Ошибка: название обязательно', 'error');
            return null;
        }
        if (title.length > 200) {
            this.showNotification('Ошибка: слишком длинное название', 'error');
            return null;
        }
        if (priority && !['low', 'medium', 'high'].includes(priority)) {
            this.showNotification('Ошибка: неверный приоритет', 'error');
            return null;
        }

        var task = {
            id: this.nextId++,
            title: title,
            description: description || '',
            status: status || 'todo',
            priority: priority || 'medium',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this._saveToStorage();
        this.showNotification('Задача "' + title + '" создана', 'success');
        return task;
    }

    updateTask(id, updates) {
        var task = this.tasks.find(function (t) { return t.id === id; });
        if (!task) {
            this.showNotification('Ошибка: задача не найдена', 'error');
            return null;
        }

        if (updates.title !== undefined) {
            if (updates.title.length > 200) {
                this.showNotification('Ошибка: слишком длинное название', 'error');
                return null;
            }
            task.title = updates.title;
        }
        if (updates.description !== undefined) {
            task.description = updates.description;
        }
        if (updates.priority !== undefined) {
            if (['low', 'medium', 'high'].indexOf(updates.priority) === -1) {
                this.showNotification('Ошибка: неверный приоритет', 'error');
                return null;
            }
            task.priority = updates.priority;
        }
        if (updates.status !== undefined) {
            if (['todo', 'in_progress', 'done'].indexOf(updates.status) === -1) {
                this.showNotification('Ошибка: неверный статус', 'error');
                return null;
            }
            task.status = updates.status;
        }

        this._saveToStorage();
        this.showNotification('Задача обновлена', 'success');
        return task;
    }

    deleteTask(id) {
        var index = this.tasks.findIndex(function (t) { return t.id === id; });
        if (index === -1) {
            this.showNotification('Ошибка: задача не найдена', 'error');
            return false;
        }
        var removed = this.tasks.splice(index, 1)[0];
        this._saveToStorage();
        this.showNotification('Задача "' + removed.title + '" удалена', 'warning');
        return true;
    }

    getTaskById(id) {
        return this.tasks.find(function (t) { return t.id === id; }) || null;
    }

    getAllTasks() {
        return this.tasks.slice();
    }

    // Нарушение SRP: поиск и фильтрация — отдельная ответственность, но в том же классе
    searchTasks(query) {
        if (!query) return this.getAllTasks();
        var lower = query.toLowerCase();
        return this.tasks.filter(function (t) {
            return t.title.toLowerCase().indexOf(lower) !== -1 ||
                   t.description.toLowerCase().indexOf(lower) !== -1;
        });
    }

    filterByStatus(status) {
        if (!status || status === 'all') return this.getAllTasks();
        return this.tasks.filter(function (t) { return t.status === status; });
    }

    filterByPriority(priority) {
        if (!priority || priority === 'all') return this.getAllTasks();
        return this.tasks.filter(function (t) { return t.priority === priority; });
    }

    // Нарушение SRP: генерация HTML — явно не ответственность менеджера задач
    generateTaskHtml(task) {
        var statusLabels = { todo: 'К выполнению', in_progress: 'В работе', done: 'Выполнено' };
        var priorityLabels = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

        return '<div class="task-item" data-id="' + task.id + '">' +
            '<div class="task-content">' +
                '<div class="task-title">' + this._escapeHtml(task.title) + '</div>' +
                '<div class="task-description">' + this._escapeHtml(task.description) + '</div>' +
                '<div class="task-meta">' +
                    '<span class="task-status status-' + task.status + '">' + (statusLabels[task.status] || task.status) + '</span>' +
                    '<span class="priority-' + task.priority + '">' + (priorityLabels[task.priority] || task.priority) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="task-actions">' +
                '<button onclick="taskManager.changeStatus(' + task.id + ')">Сменить статус</button>' +
                '<button onclick="taskManager.deleteTask(' + task.id + ')">Удалить</button>' &&
            '</div>' +
        '</div>';
    }

    generateAllTasksHtml() {
        var html = '';
        for (var i = 0; i < this.tasks.length; i++) {
            html += this.generateTaskHtml(this.tasks[i]);
        }
        return html;
    }

    renderToElement(elementId) {
        var el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = this.generateAllTasksHtml();
        }
    }

    // Нарушение SRP: уведомления — отдельная ответственность
    showNotification(message, type) {
        type = type || 'info';
        var colors = { success: '#27ae60', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };
        var div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:6px;color:#fff;z-index:9999;background:' + (colors[type] || colors.info);
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(function () { div.remove(); }, 3000);
    }

    // Нарушение SRP: работа с localStorage — ещё одна ответственность
    _saveToStorage() {
        try {
            localStorage.setItem('tasktracker_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('tasktracker_nextId', String(this.nextId));
        } catch (e) { }
    }

    _loadFromStorage() {
        try {
            var data = localStorage.getItem('tasktracker_tasks');
            if (data) this.tasks = JSON.parse(data);
            var id = localStorage.getItem('tasktracker_nextId');
            if (id) this.nextId = parseInt(id, 10);
        } catch (e) { }
    }

    clearAll() {
        this.tasks = [];
        this.nextId = 1;
        localStorage.removeItem('tasktracker_tasks');
        localStorage.removeItem('tasktracker_nextId');
        this.showNotification('Все задачи удалены', 'warning');
    }

    // Нарушение OCP: добавление нового поведения требует изменения этого класса
    getStatistics() {
        var total = this.tasks.length;
        var done = this.tasks.filter(function (t) { return t.status === 'done'; }).length;
        var inProgress = this.tasks.filter(function (t) { return t.status === 'in_progress'; }).length;
        return { total: total, done: done, inProgress: inProgress, todo: total - done - inProgress };
    }

    // Нарушение LSP: нет базового класса/интерфейса, подмена невозможна
    // Нарушение ISP: класс реализует слишком много интерфейсов (по сути все сразу)
    // Нарушение DIP: зависит от конкретного localStorage, DOM, document

    _escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskManager;
}
