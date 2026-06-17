const {
    generateId,
    createTask,
    addTask,
    deleteTask,
    getNextStatus,
    changeStatus,
    setStatus,
    getTaskById,
    filterTasks,
    searchTasks,
    getStatusLabel,
    getPriorityLabel
} = require('../js/tasks');

describe('generateId', () => {
    test('возвращает строку', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
    });

    test('генерирует уникальные id', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
    });
});

describe('createTask', () => {
    test('создаёт задачу с переданными параметрами', () => {
        const task = createTask('Тестовая задача', 'Описание', 'high');
        expect(task.title).toBe('Тестовая задача');
        expect(task.description).toBe('Описание');
        expect(task.priority).toBe('high');
        expect(task.status).toBe('todo');
        expect(task.id).toBeDefined();
        expect(task.createdAt).toBeDefined();
    });

    test('устанавливает средний приоритет по умолчанию', () => {
        const task = createTask('Задача');
        expect(task.priority).toBe('medium');
    });

    test('обрезает пробелы в названии', () => {
        const task = createTask('  Задача  ');
        expect(task.title).toBe('Задача');
    });

    test('выбрасывает ошибку при пустом названии', () => {
        expect(() => createTask('')).toThrow('Название задачи обязательно');
    });

    test('выбрасывает ошибку при null названии', () => {
        expect(() => createTask(null)).toThrow('Название задачи обязательно');
    });

    test('выбрасывает ошибка при названии из пробелов', () => {
        expect(() => createTask('   ')).toThrow('Название задачи обязательно');
    });
});

describe('addTask', () => {
    test('добавляет задачу в массив', () => {
        const tasks = [];
        addTask(tasks, 'Задача 1', 'Описание', 'low');
        expect(tasks.length).toBe(1);
        expect(tasks[0].title).toBe('Задача 1');
    });

    test('добавляет несколько задач', () => {
        const tasks = [];
        addTask(tasks, 'Задача 1');
        addTask(tasks, 'Задача 2');
        addTask(tasks, 'Задача 3');
        expect(tasks.length).toBe(3);
    });

    test('возвращает добавленную задачу', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        expect(task).toBe(tasks[0]);
        expect(task.id).toBeDefined();
    });
});

describe('deleteTask', () => {
    test('удаляет задачу по id', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача 1');
        deleteTask(tasks, task.id);
        expect(tasks.length).toBe(0);
    });

    test('удаляет правильную задачу из нескольких', () => {
        const tasks = [];
        const task1 = addTask(tasks, 'Задача 1');
        addTask(tasks, 'Задача 2');
        const task3 = addTask(tasks, 'Задача 3');
        deleteTask(tasks, task1.id);
        expect(tasks.length).toBe(2);
        expect(tasks[0].title).toBe('Задача 2');
        expect(tasks[1].title).toBe('Задача 3');
    });

    test('возвращает удалённую задачу', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        const removed = deleteTask(tasks, task.id);
        expect(removed.id).toBe(task.id);
    });

    test('выбрасывает ошибку при несуществующем id', () => {
        const tasks = [];
        addTask(tasks, 'Задача');
        expect(() => deleteTask(tasks, 'nonexistent')).toThrow('Задача не найдена');
    });
});

describe('getNextStatus', () => {
    test('todo -> in_progress', () => {
        expect(getNextStatus('todo')).toBe('in_progress');
    });

    test('in_progress -> done', () => {
        expect(getNextStatus('in_progress')).toBe('done');
    });

    test('done -> todo (циклически)', () => {
        expect(getNextStatus('done')).toBe('todo');
    });
});

describe('changeStatus', () => {
    test('меняет статус на следующий', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        expect(task.status).toBe('todo');
        changeStatus(tasks, task.id);
        expect(task.status).toBe('in_progress');
    });

    test('меняет статус через полный цикл', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        changeStatus(tasks, task.id);
        expect(task.status).toBe('in_progress');
        changeStatus(tasks, task.id);
        expect(task.status).toBe('done');
        changeStatus(tasks, task.id);
        expect(task.status).toBe('todo');
    });

    test('выбрасывает ошибку при несуществующем id', () => {
        const tasks = [];
        expect(() => changeStatus(tasks, 'nonexistent')).toThrow('Задача не найдена');
    });
});

describe('setStatus', () => {
    test('устанавливает статус todo', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        setStatus(tasks, task.id, 'todo');
        expect(task.status).toBe('todo');
    });

    test('устанавливает статус in_progress', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        setStatus(tasks, task.id, 'in_progress');
        expect(task.status).toBe('in_progress');
    });

    test('устанавливает статус done', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        setStatus(tasks, task.id, 'done');
        expect(task.status).toBe('done');
    });

    test('выбрасывает ошибку при неверном статусе', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        expect(() => setStatus(tasks, task.id, 'invalid')).toThrow('Неверный статус');
    });

    test('выбрасывает ошибку при несуществующем id', () => {
        const tasks = [];
        expect(() => setStatus(tasks, 'nonexistent', 'done')).toThrow('Задача не найдена');
    });
});

describe('getTaskById', () => {
    test('находит задачу по id', () => {
        const tasks = [];
        const task = addTask(tasks, 'Задача');
        const found = getTaskById(tasks, task.id);
        expect(found.id).toBe(task.id);
        expect(found.title).toBe('Задача');
    });

    test('выбрасывает ошибку при несуществующем id', () => {
        const tasks = [];
        expect(() => getTaskById(tasks, 'nonexistent')).toThrow('Задача не найдена');
    });
});

describe('filterTasks', () => {
    test('возвращает все задачи при фильтре all', () => {
        const tasks = [];
        addTask(tasks, 'Задача 1');
        addTask(tasks, 'Задача 2');
        expect(filterTasks(tasks, 'all').length).toBe(2);
    });

    test('фильтрует по статусу todo', () => {
        const tasks = [];
        const task1 = addTask(tasks, 'Задача 1');
        const task2 = addTask(tasks, 'Задача 2');
        changeStatus(tasks, task2.id);
        const filtered = filterTasks(tasks, 'todo');
        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe(task1.id);
    });

    test('фильтрует по статусу in_progress', () => {
        const tasks = [];
        const task1 = addTask(tasks, 'Задача 1');
        const task2 = addTask(tasks, 'Задача 2');
        setStatus(tasks, task1.id, 'in_progress');
        const filtered = filterTasks(tasks, 'in_progress');
        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe(task1.id);
    });

    test('фильтрует по статусу done', () => {
        const tasks = [];
        addTask(tasks, 'Задача 1');
        const task2 = addTask(tasks, 'Задача 2');
        setStatus(tasks, task2.id, 'done');
        const filtered = filterTasks(tasks, 'done');
        expect(filtered.length).toBe(1);
        expect(filtered[0].id).toBe(task2.id);
    });

    test('возвращает все при пустом фильтре', () => {
        const tasks = [];
        addTask(tasks, 'Задача');
        expect(filterTasks(tasks, '').length).toBe(1);
        expect(filterTasks(tasks, null).length).toBe(1);
    });
});

describe('searchTasks', () => {
    test('ищет по названию', () => {
        const tasks = [];
        addTask(tasks, 'Купить продукты');
        addTask(tasks, 'Написать код');
        addTask(tasks, 'Позвонить другу');
        const results = searchTasks(tasks, 'продукты');
        expect(results.length).toBe(1);
        expect(results[0].title).toBe('Купить продукты');
    });

    test('ищет по описанию', () => {
        const tasks = [];
        addTask(tasks, 'Задача', 'Купить молоко в магазине');
        addTask(tasks, 'Задача 2', 'Написать отчёт');
        const results = searchTasks(tasks, 'молоко');
        expect(results.length).toBe(1);
    });

    test('поиск регистронезависимый', () => {
        const tasks = [];
        addTask(tasks, 'Купить Продукты');
        const results = searchTasks(tasks, 'продукты');
        expect(results.length).toBe(1);
    });

    test('возвращает все при пустом запросе', () => {
        const tasks = [];
        addTask(tasks, 'Задача 1');
        addTask(tasks, 'Задача 2');
        expect(searchTasks(tasks, '').length).toBe(2);
        expect(searchTasks(tasks, null).length).toBe(2);
    });

    test('возвращает пустой массив при совпадений', () => {
        const tasks = [];
        addTask(tasks, 'Задача');
        expect(searchTasks(tasks, 'несуществующее').length).toBe(0);
    });
});

describe('getStatusLabel', () => {
    test('возвращает русское название статуса', () => {
        expect(getStatusLabel('todo')).toBe('К выполнению');
        expect(getStatusLabel('in_progress')).toBe('В работе');
        expect(getStatusLabel('done')).toBe('Выполнено');
    });

    test('возвращает исходное значение для неизвестного статуса', () => {
        expect(getStatusLabel('unknown')).toBe('unknown');
    });
});

describe('getPriorityLabel', () => {
    test('возвращает русское название приоритета', () => {
        expect(getPriorityLabel('low')).toBe('Низкий');
        expect(getPriorityLabel('medium')).toBe('Средний');
        expect(getPriorityLabel('high')).toBe('Высокий');
    });

    test('возвращает исходное значение для неизвестного приоритета', () => {
        expect(getPriorityLabel('unknown')).toBe('unknown');
    });
});

describe('Интеграционные сценарии', () => {
    test('полный цикл: создание -> смена статуса -> удаление', () => {
        const tasks = [];

        // Создание
        const task = addTask(tasks, 'Интеграционная задача', 'Тест', 'high');
        expect(tasks.length).toBe(1);
        expect(task.status).toBe('todo');

        // Смена статуса
        changeStatus(tasks, task.id);
        expect(task.status).toBe('in_progress');
        changeStatus(tasks, task.id);
        expect(task.status).toBe('done');

        // Удаление
        deleteTask(tasks, task.id);
        expect(tasks.length).toBe(0);
    });

    test('фильтрация и поиск вместе', () => {
        const tasks = [];
        const t1 = addTask(tasks, 'Купить продукты');
        const t2 = addTask(tasks, 'Написать код');
        const t3 = addTask(tasks, 'Купить билеты');
        setStatus(tasks, t2.id, 'done');

        const todoTasks = filterTasks(tasks, 'todo');
        expect(todoTasks.length).toBe(2);

        const results = searchTasks(todoTasks, 'Купить');
        expect(results.length).toBe(2);
    });
});
