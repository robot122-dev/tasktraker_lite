// OCP: оркестратор, легко расширяется добавлением новых сервисов
// DIP: зависит от абстракций, не от конкретных реализаций
// LSP: все сервисы подставляются через интерфейсы
class TaskManager {
    constructor(taskService, renderer, notificationService) {
        this._taskService = taskService;
        this._renderer = renderer;
        this._notification = notificationService;
    }

    getAllTasks() {
        return this._taskService.getAllTasks();
    }

    addTask(title, description, priority) {
        return this._taskService.addTask(title, description, priority);
    }

    updateTask(id, updates) {
        return this._taskService.updateTask(id, updates);
    }

    deleteTask(id) {
        return this._taskService.deleteTask(id);
    }

    changeStatus(id) {
        return this._taskService.changeStatus(id);
    }

    searchTasks(query) {
        return this._taskService.searchTasks(query);
    }

    filterByStatus(status) {
        return this._taskService.filterByStatus(status);
    }

    filterByPriority(priority) {
        return this._taskService.filterByPriority(priority);
    }

    getStatistics() {
        return this._taskService.getStatistics();
    }

    renderToElement(elementId, tasks) {
        if (typeof document === 'undefined') return;
        var el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = this._renderer.renderList(tasks || this.getAllTasks());
        }
    }

    renderFiltered(elementId, filter, searchQuery) {
        var tasks = this._taskService.filterByStatus(filter);
        if (searchQuery) {
            var lower = searchQuery.toLowerCase();
            tasks = tasks.filter(function (t) {
                return t.title.toLowerCase().indexOf(lower) !== -1 ||
                       t.description.toLowerCase().indexOf(lower) !== -1;
            });
        }
        this.renderToElement(elementId, tasks);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskManager;
}
