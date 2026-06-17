// ISP: узкий интерфейс для хранения задач
class ITaskRepository {
    findAll() { throw new Error('Not implemented'); }
    findById(id) { throw new Error('Not implemented'); }
    save(task) { throw new Error('Not implemented'); }
    saveAll(tasks) { throw new Error('Not implemented'); }
    delete(id) { throw new Error('Not implemented'); }
    clear() { throw new Error('Not implemented'); }
    getNextId() { throw new Error('Not implemented'); }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ITaskRepository;
}
