// DIP: реализует абстракцию IHtmlRenderer
class HtmlRenderer {
    constructor() {
        this._statusLabels = {
            todo: 'К выполнению',
            in_progress: 'В работе',
            done: 'Выполнено'
        };
        this._priorityLabels = {
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий'
        };
    }

    renderTask(task) {
        return '<div class="task-item" data-id="' + task.id + '">' +
            '<div class="task-content">' +
                '<div class="task-title">' + this._escapeHtml(task.title) + '</div>' +
                (task.description ? '<div class="task-description">' + this._escapeHtml(task.description) + '</div>' : '') +
                '<div class="task-meta">' +
                    '<span class="task-status status-' + task.status + '">' + (this._statusLabels[task.status] || task.status) + '</span>' +
                    '<span class="priority-' + task.priority + '">' + (this._priorityLabels[task.priority] || task.priority) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="task-actions">' +
                '<button class="btn-status">Сменить статус</button>' +
                '<button class="btn-delete">Удалить</button>' +
            '</div>' +
        '</div>';
    }

    renderList(tasks) {
        if (!tasks || tasks.length === 0) {
            return this.renderEmpty();
        }
        var html = '';
        for (var i = 0; i < tasks.length; i++) {
            html += this.renderTask(tasks[i]);
        }
        return html;
    }

    renderEmpty() {
        return '<p class="empty-message">Задач пока нет. Добавьте первую задачу!</p>';
    }

    _escapeHtml(text) {
        if (typeof document === 'undefined') return text;
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HtmlRenderer;
}
