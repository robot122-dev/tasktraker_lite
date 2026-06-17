class Task {
    constructor(id, title, description, status, priority, createdAt) {
        this.id = id;
        this.title = title;
        this.description = description || '';
        this.status = status || 'todo';
        this.priority = priority || 'medium';
        this.createdAt = createdAt || new Date().toISOString();
    }

    static VALID_STATUSES = ['todo', 'in_progress', 'done'];
    static VALID_PRIORITIES = ['low', 'medium', 'high'];

    isValid() {
        return this.title &&
            typeof this.title === 'string' &&
            this.title.trim().length > 0 &&
            Task.VALID_STATUSES.indexOf(this.status) !== -1 &&
            Task.VALID_PRIORITIES.indexOf(this.priority) !== -1;
    }

    static validateTitle(title) {
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Название задачи обязательно');
        }
        if (title.length > 200) {
            throw new Error('Название задачи слишком длинное');
        }
    }

    static validateStatus(status) {
        if (Task.VALID_STATUSES.indexOf(status) === -1) {
            throw new Error('Неверный статус: ' + status);
        }
    }

    static validatePriority(priority) {
        if (Task.VALID_PRIORITIES.indexOf(priority) === -1) {
            throw new Error('Неверный приоритет: ' + priority);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Task;
}
