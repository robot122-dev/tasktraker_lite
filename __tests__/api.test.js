const request = require('supertest');
const { app, getTasks, setTasks, resetId } = require('../server');

beforeEach(() => {
    setTasks([]);
    resetId();
});

describe('POST /api/tasks', () => {
    test('создание задачи', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ title: 'Тестовая задача', description: 'Описание', priority: 'high' });
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Тестовая задача');
        expect(res.body.status).toBe('todo');
        expect(res.body.priority).toBe('high');
        expect(res.body.id).toBeDefined();
    });

    test('ошибка при пустом названии', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ title: '' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test('ошибка при неверном приоритете', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ title: 'Задача', priority: 'urgent' });
        expect(res.status).toBe(400);
    });

    test('значения по умолчанию', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ title: 'Минимальная задача' });
        expect(res.body.status).toBe('todo');
        expect(res.body.priority).toBe('medium');
        expect(res.body.description).toBe('');
    });
});

describe('GET /api/tasks', () => {
    test('возвращает пустой массив', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('возвращает все задачи', async () => {
        await request(app).post('/api/tasks').send({ title: 'Задача 1' });
        await request(app).post('/api/tasks').send({ title: 'Задача 2' });
        const res = await request(app).get('/api/tasks');
        expect(res.body.length).toBe(2);
    });

    test('фильтрация по статусу', async () => {
        await request(app).post('/api/tasks').send({ title: 'A' });
        const task = (await request(app).post('/api/tasks').send({ title: 'B' })).body;
        await request(app).patch(`/api/tasks/${task.id}/status`).send({ status: 'done' });

        const res = await request(app).get('/api/tasks?status=done');
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('B');
    });

    test('ошибка при неверном статусе', async () => {
        const res = await request(app).get('/api/tasks?status=invalid');
        expect(res.status).toBe(400);
    });
});

describe('GET /api/tasks/:id', () => {
    test('находит задачу по id', async () => {
        const created = (await request(app).post('/api/tasks').send({ title: 'Найди меня' })).body;
        const res = await request(app).get(`/api/tasks/${created.id}`);
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Найди меня');
    });

    test('404 при несуществующем id', async () => {
        const res = await request(app).get('/api/tasks/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Task not found');
    });
});

describe('PUT /api/tasks/:id', () => {
    test('обновляет задачу', async () => {
        const task = (await request(app).post('/api/tasks').send({ title: 'Старое' })).body;
        const res = await request(app)
            .put(`/api/tasks/${task.id}`)
            .send({ title: 'Новое', priority: 'low' });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Новое');
        expect(res.body.priority).toBe('low');
    });

    test('404 при несуществующем id', async () => {
        const res = await request(app).put('/api/tasks/999').send({ title: 'X' });
        expect(res.status).toBe(404);
    });

    test('400 при невалидных данных', async () => {
        const task = (await request(app).post('/api/tasks').send({ title: 'Тест' })).body;
        const res = await request(app).put(`/api/tasks/${task.id}`).send({ title: '' });
        expect(res.status).toBe(400);
    });
});

describe('PATCH /api/tasks/:id/status', () => {
    test('меняет статус', async () => {
        const task = (await request(app).post('/api/tasks').send({ title: 'Задача' })).body;
        const res = await request(app)
            .patch(`/api/tasks/${task.id}/status`)
            .send({ status: 'in_progress' });
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
    });

    test('404 при несуществующем id', async () => {
        const res = await request(app).patch('/api/tasks/999/status').send({ status: 'done' });
        expect(res.status).toBe(404);
    });

    test('400 при неверном статусе', async () => {
        const task = (await request(app).post('/api/tasks').send({ title: 'Задача' })).body;
        const res = await request(app)
            .patch(`/api/tasks/${task.id}/status`)
            .send({ status: 'invalid' });
        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/tasks/:id', () => {
    test('удаляет задачу', async () => {
        const task = (await request(app).post('/api/tasks').send({ title: 'Удали меня' })).body;
        const res = await request(app).delete(`/api/tasks/${task.id}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Задача удалена');

        const check = await request(app).get(`/api/tasks/${task.id}`);
        expect(check.status).toBe(404);
    });

    test('404 при несуществующем id', async () => {
        const res = await request(app).delete('/api/tasks/999');
        expect(res.status).toBe(404);
    });
});

describe('GET /api/tasks/search', () => {
    test('ищет по названию', async () => {
        await request(app).post('/api/tasks').send({ title: 'Купить продукты' });
        await request(app).post('/api/tasks').send({ title: 'Написать код' });
        const res = await request(app).get('/api/tasks/search?query=продукты');
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Купить продукты');
    });

    test('ищет по описанию', async () => {
        await request(app).post('/api/tasks').send({ title: 'Задача', description: 'Купить молоко' });
        const res = await request(app).get('/api/tasks/search?query=молоко');
        expect(res.body.length).toBe(1);
    });

    test('пустой запрос возвращает все', async () => {
        await request(app).post('/api/tasks').send({ title: 'A' });
        const res = await request(app).get('/api/tasks/search?query=');
        expect(res.body.length).toBe(1);
    });

    test('регистронезависимый поиск', async () => {
        await request(app).post('/api/tasks').send({ title: 'Купить Продукты' });
        const res = await request(app).get('/api/tasks/search?query=продукты');
        expect(res.body.length).toBe(1);
    });
});

describe('GET /api/tasks/statistics', () => {
    test('возвращает статистику', async () => {
        await request(app).post('/api/tasks').send({ title: 'A' });
        const t1 = (await request(app).post('/api/tasks').send({ title: 'B' })).body;
        const t2 = (await request(app).post('/api/tasks').send({ title: 'C' })).body;
        await request(app).patch(`/api/tasks/${t1.id}/status`).send({ status: 'done' });
        await request(app).patch(`/api/tasks/${t2.id}/status`).send({ status: 'in_progress' });

        const res = await request(app).get('/api/tasks/statistics');
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(3);
        expect(res.body.todo).toBe(1);
        expect(res.body.in_progress).toBe(1);
        expect(res.body.done).toBe(1);
    });

    test('пустая статистика', async () => {
        const res = await request(app).get('/api/tasks/statistics');
        expect(res.body).toEqual({ total: 0, todo: 0, in_progress: 0, done: 0 });
    });
});

describe('Swagger', () => {
    test('документация доступна', async () => {
        const res = await request(app).get('/api-docs.json');
        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe('3.0.0');
        expect(res.body.info.title).toBe('TaskTracker Lite API');
    });
});
