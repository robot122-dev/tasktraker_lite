const TaskManager = require('../js/bad-task-manager');

// Мокаем localStorage и document для Node.js окружения
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

const documentMock = {
    createElement: (tag) => ({
        style: {},
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        remove: () => {}
    }),
    body: { appendChild: () => {} },
    getElementById: () => null
};
global.document = documentMock;

describe('TaskManager (плохая реализация)', () => {
    let manager;

    beforeEach(() => {
        localStorageMock.clear();
        manager = new TaskManager();
    });

    test('создание задачи', () => {
        const task = manager.addTask('Тест', 'Описание', 'high');
        expect(task).not.toBeNull();
        expect(task.title).toBe('Тест');
        expect(task.priority).toBe('high');
    });

    test('удаление задачи', () => {
        manager.addTask('Задача для удаления');
        const task = manager.getAllTasks()[0];
        const result = manager.deleteTask(task.id);
        expect(result).toBe(true);
        expect(manager.getAllTasks().length).toBe(0);
    });

    test('смена статуса через updateTask', () => {
        manager.addTask('Задача');
        const task = manager.getAllTasks()[0];
        manager.updateTask(task.id, { status: 'in_progress' });
        expect(manager.getTaskById(task.id).status).toBe('in_progress');
    });

    test('поиск задач', () => {
        manager.addTask('Купить продукты');
        manager.addTask('Написать код');
        const results = manager.searchTasks('продукты');
        expect(results.length).toBe(1);
    });

    test('фильтрация по статусу', () => {
        manager.addTask('Задача 1');
        manager.addTask('Задача 2');
        const task = manager.getAllTasks()[0];
        manager.updateTask(task.id, { status: 'done' });
        const doneTasks = manager.filterByStatus('done');
        expect(doneTasks.length).toBe(1);
    });

    test('статистика', () => {
        manager.addTask('Задача 1');
        manager.addTask('Задача 2');
        manager.addTask('Задача 3');
        const task = manager.getAllTasks()[0];
        manager.updateTask(task.id, { status: 'done' });
        const stats = manager.getStatistics();
        expect(stats.total).toBe(3);
        expect(stats.done).toBe(1);
    });
});
