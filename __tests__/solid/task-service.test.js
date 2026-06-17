const TaskService = require('../../js/solid/task-service');
const LocalStorageRepository = require('../../js/solid/local-storage-repository');
const NotificationService = require('../../js/solid/notification-service');

// Мокаем localStorage и document
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
global.localStorage = localStorageMock;
global.document = {
    createElement: () => ({ style: {}, textContent: '', appendChild: () => {}, remove: () => {} }),
    body: { appendChild: () => {} }
};

describe('TaskService', () => {
    let service;
    let repo;
    let notification;

    beforeEach(() => {
        localStorageMock.clear();
        repo = new LocalStorageRepository('test_service');
        notification = new NotificationService();
        service = new TaskService(repo, notification);
    });

    test('addTask создаёт задачу', () => {
        const task = service.addTask('Тест', 'Описание', 'high');
        expect(task.title).toBe('Тест');
        expect(task.priority).toBe('high');
        expect(task.status).toBe('todo');
    });

    test('addTask с пустым названием выбрасывает ошибку', () => {
        expect(() => service.addTask('')).toThrow('Название задачи обязательно');
    });

    test('deleteTask удаляет задачу', () => {
        const task = service.addTask('Для удаления');
        service.deleteTask(task.id);
        expect(service.getAllTasks().length).toBe(0);
    });

    test('deleteTask выбрасывает ошибку при несуществующем id', () => {
        expect(() => service.deleteTask(999)).toThrow('Задача не найдена');
    });

    test('changeStatus меняет статус', () => {
        const task = service.addTask('Задача');
        service.changeStatus(task.id);
        expect(service.getTaskById(task.id).status).toBe('in_progress');
    });

    test('changeStatus циклически переключает статусы', () => {
        const task = service.addTask('Задача');
        service.changeStatus(task.id);
        expect(service.getTaskById(task.id).status).toBe('in_progress');
        service.changeStatus(task.id);
        expect(service.getTaskById(task.id).status).toBe('done');
        service.changeStatus(task.id);
        expect(service.getTaskById(task.id).status).toBe('todo');
    });

    test('searchTasks ищет по названию', () => {
        service.addTask('Купить продукты');
        service.addTask('Написать код');
        expect(service.searchTasks('продукты').length).toBe(1);
    });

    test('searchTasks ищет по описанию', () => {
        service.addTask('Задача', 'Купить молоко');
        expect(service.searchTasks('молоко').length).toBe(1);
    });

    test('filterByStatus фильтрует', () => {
        const t1 = service.addTask('Задача 1');
        service.addTask('Задача 2');
        service.changeStatus(t1.id);
        expect(service.filterByStatus('in_progress').length).toBe(1);
        expect(service.filterByStatus('todo').length).toBe(1);
    });

    test('getStatistics считает', () => {
        service.addTask('A');
        service.addTask('B');
        service.addTask('C');
        const t1 = service.getAllTasks()[0];
        service.changeStatus(t1.id);
        service.changeStatus(t1.id);
        const stats = service.getStatistics();
        expect(stats.total).toBe(3);
        expect(stats.done).toBe(1);
        expect(stats.todo).toBe(2);
    });

    test('clearAll очищает', () => {
        service.addTask('Задача');
        service.clearAll();
        expect(service.getAllTasks().length).toBe(0);
    });

    test('updateTask обновляет поля', () => {
        const task = service.addTask('Старое');
        service.updateTask(task.id, { title: 'Новое', priority: 'low' });
        const updated = service.getTaskById(task.id);
        expect(updated.title).toBe('Новое');
        expect(updated.priority).toBe('low');
    });

    test('filterByPriority фильтрует', () => {
        service.addTask('A', '', 'low');
        service.addTask('B', '', 'high');
        expect(service.filterByPriority('low').length).toBe(1);
        expect(service.filterByPriority('high').length).toBe(1);
    });
});
