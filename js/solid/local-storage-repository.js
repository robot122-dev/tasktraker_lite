// DIP: зависит от абстракции ITaskRepository, реализует конкретное хранилище
class LocalStorageRepository {
    constructor(storageKey) {
        this._storageKey = storageKey || 'tasktracker_tasks';
        this._idKey = this._storageKey + '_nextId';
    }

    findAll() {
        try {
            var data = localStorage.getItem(this._storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    findById(id) {
        var tasks = this.findAll();
        return tasks.find(function (t) { return t.id === id; }) || null;
    }

    save(task) {
        var tasks = this.findAll();
        var index = tasks.findIndex(function (t) { return t.id === task.id; });
        if (index >= 0) {
            tasks[index] = task;
        } else {
            tasks.push(task);
        }
        this._persist(tasks);
        return task;
    }

    saveAll(tasks) {
        this._persist(tasks);
    }

    delete(id) {
        var tasks = this.findAll();
        var filtered = tasks.filter(function (t) { return t.id !== id; });
        this._persist(filtered);
        return filtered.length < tasks.length;
    }

    clear() {
        localStorage.removeItem(this._storageKey);
        localStorage.removeItem(this._idKey);
    }

    getNextId() {
        try {
            var id = localStorage.getItem(this._idKey);
            var nextId = id ? parseInt(id, 10) : 1;
            localStorage.setItem(this._idKey, String(nextId + 1));
            return nextId;
        } catch (e) {
            return Date.now();
        }
    }

    _persist(tasks) {
        try {
            localStorage.setItem(this._storageKey, JSON.stringify(tasks));
        } catch (e) { }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageRepository;
}
