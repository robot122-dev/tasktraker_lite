const Task = require('../../js/solid/task');

describe('Task (модель)', () => {
    test('создание задачи с параметрами', () => {
        const task = new Task(1, 'Задача', 'Описание', 'todo', 'high');
        expect(task.id).toBe(1);
        expect(task.title).toBe('Задача');
        expect(task.description).toBe('Описание');
        expect(task.status).toBe('todo');
        expect(task.priority).toBe('high');
    });

    test('значения по умолчанию', () => {
        const task = new Task(1, 'Задача');
        expect(task.description).toBe('');
        expect(task.status).toBe('todo');
        expect(task.priority).toBe('medium');
        expect(task.createdAt).toBeDefined();
    });

    test('валидация корректной задачи', () => {
        const task = new Task(1, 'Задача', '', 'todo', 'medium');
        expect(task.isValid()).toBe(true);
    });

    test('validateTitle выбрасывает ошибку при пустом названии', () => {
        expect(() => Task.validateTitle('')).toThrow('Название задачи обязательно');
        expect(() => Task.validateTitle(null)).toThrow('Название задачи обязательно');
    });

    test('validateTitle выбрасывает ошибку при длинном названии', () => {
        const longTitle = 'a'.repeat(201);
        expect(() => Task.validateTitle(longTitle)).toThrow('слишком длинное');
    });

    test('validateStatus выбрасывает ошибку при неверном статусе', () => {
        expect(() => Task.validateStatus('invalid')).toThrow('Неверный статус');
    });

    test('validatePriority выбрасывает ошибку при неверном приоритете', () => {
        expect(() => Task.validatePriority('urgent')).toThrow('Неверный приоритет');
    });

    test('VALID_STATUSES содержит все статусы', () => {
        expect(Task.VALID_STATUSES).toEqual(['todo', 'in_progress', 'done']);
    });

    test('VALID_PRIORITIES содержит все приоритеты', () => {
        expect(Task.VALID_PRIORITIES).toEqual(['low', 'medium', 'high']);
    });
});
