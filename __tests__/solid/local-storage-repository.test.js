const LocalStorageRepository = require('../../js/solid/local-storage-repository');

// Мокаем localStorage
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

describe('LocalStorageRepository', () => {
    let repo;

    beforeEach(() => {
        localStorageMock.clear();
        repo = new LocalStorageRepository('test_tasks');
    });

    test('findAll возвращает пустой массив при отсутствии данных', () => {
        expect(repo.findAll()).toEqual([]);
    });

    test('save и findAll', () => {
        const task = { id: 1, title: 'Тест', status: 'todo' };
        repo.save(task);
        const all = repo.findAll();
        expect(all.length).toBe(1);
        expect(all[0].title).toBe('Тест');
    });

    test('findById находит задачу', () => {
        repo.save({ id: 42, title: 'Найди меня' });
        const found = repo.findById(42);
        expect(found).not.toBeNull();
        expect(found.title).toBe('Найди меня');
    });

    test('findById возвращает null при отсутствии', () => {
        expect(repo.findById(999)).toBeNull();
    });

    test('delete удаляет задачу', () => {
        repo.save({ id: 1, title: 'Удали меня' });
        repo.save({ id: 2, title: 'Оставь меня' });
        const result = repo.delete(1);
        expect(result).toBe(true);
        expect(repo.findAll().length).toBe(1);
    });

    test('clear очищает всё', () => {
        repo.save({ id: 1, title: 'Задача' });
        repo.clear();
        expect(repo.findAll()).toEqual([]);
    });

    test('getNextId генерирует последовательные id', () => {
        const id1 = repo.getNextId();
        const id2 = repo.getNextId();
        expect(id2).toBe(id1 + 1);
    });

    test('saveAll сохраняет массив задач', () => {
        const tasks = [
            { id: 1, title: 'A' },
            { id: 2, title: 'B' }
        ];
        repo.saveAll(tasks);
        expect(repo.findAll().length).toBe(2);
    });

    test('save обновляет существующую задачу', () => {
        repo.save({ id: 1, title: 'Старое' });
        repo.save({ id: 1, title: 'Новое' });
        expect(repo.findAll().length).toBe(1);
        expect(repo.findById(1).title).toBe('Новое');
    });
});
