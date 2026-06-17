const Task = require('./task');

// SRP: единственная ответственность — бизнес-логика задач
// DIP: зависит от абстракций ITaskRepository и INotificationService
// OCP: новые операции добавляются без изменения существующих
class TaskService {
    constructor(repository, notificationService) {
        this._repository = repository;
        this._notification = notificationService;
    }

    getAllTasks() {
        return this._repository.findAll();
    }

    getTaskById(id) {
        return this._repository.findById(id);
    }

    addTask(title, description, priority) {
        try {
            Task.validateTitle(title);
            if (priority) Task.validatePriority(priority);
        } catch (e) {
            this._notification.error(e.message);
            throw e;
        }

        var id = this._repository.getNextId();
        var task = new Task(id, title.trim(), (description || '').trim(), 'todo', priority || 'medium');
        this._repository.save(task);
        this._notification.success('Задача "' + task.title + '" создана');
        return task;
    }

    updateTask(id, updates) {
        var task = this._repository.findById(id);
        if (!task) {
            var err = new Error('Задача не найдена');
            this._notification.error(err.message);
            throw err;
        }

        if (updates.title !== undefined) {
            Task.validateTitle(updates.title);
            task.title = updates.title.trim();
        }
        if (updates.description !== undefined) {
            task.description = updates.description.trim();
        }
        if (updates.priority !== undefined) {
            Task.validatePriority(updates.priority);
            task.priority = updates.priority;
        }
        if (updates.status !== undefined) {
            Task.validateStatus(updates.status);
            task.status = updates.status;
        }

        this._repository.save(task);
        this._notification.success('Задача обновлена');
        return task;
    }

    deleteTask(id) {
        var task = this._repository.findById(id);
        if (!task) {
            var err = new Error('Задача не найдена');
            this._notification.error(err.message);
            throw err;
        }
        this._repository.delete(id);
        this._notification.warning('Задача "' + task.title + '" удалена');
        return task;
    }

    changeStatus(id) {
        var task = this._repository.findById(id);
        if (!task) {
            var err = new Error('Задача не найдена');
            this._notification.error(err.message);
            throw err;
        }

        var order = ['todo', 'in_progress', 'done'];
        var idx = order.indexOf(task.status);
        task.status = (idx === -1 || idx === order.length - 1) ? 'todo' : order[idx + 1];

        this._repository.save(task);
        return task;
    }

    searchTasks(query) {
        var tasks = this._repository.findAll();
        if (!query || typeof query !== 'string' || query.trim() === '') {
            return tasks;
        }
        var lower = query.toLowerCase().trim();
        return tasks.filter(function (t) {
            return t.title.toLowerCase().indexOf(lower) !== -1 ||
                   t.description.toLowerCase().indexOf(lower) !== -1;
        });
    }

    filterByStatus(status) {
        var tasks = this._repository.findAll();
        if (!status || status === 'all') return tasks;
        return tasks.filter(function (t) { return t.status === status; });
    }

    filterByPriority(priority) {
        var tasks = this._repository.findAll();
        if (!priority || priority === 'all') return tasks;
        return tasks.filter(function (t) { return t.priority === priority; });
    }

    getStatistics() {
        var tasks = this._repository.findAll();
        var total = tasks.length;
        var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
        var inProgress = tasks.filter(function (t) { return t.status === 'in_progress'; }).length;
        return { total: total, done: done, inProgress: inProgress, todo: total - done - inProgress };
    }

    clearAll() {
        this._repository.clear();
        this._notification.warning('Все задачи удалены');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskService;
}
