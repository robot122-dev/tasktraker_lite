const request = require('supertest');
const { app, getTasks, setTasks, resetId } = require('../server');

beforeEach(() => {
    setTasks([]);
    resetId();
});

describe('Интеграционные тесты REST API (ЛР8)', () => {

    describe('POST /api/tasks — Создание задачи', () => {
        test('создание задачи и проверка структуры ответа', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({ title: 'Тестовая задача', description: 'Описание', priority: 'high' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('title', 'Тестовая задача');
            expect(res.body).toHaveProperty('description', 'Описание');
            expect(res.body).toHaveProperty('status', 'todo');
            expect(res.body).toHaveProperty('priority', 'high');
            expect(res.body).toHaveProperty('createdAt');
        });

        test('создание задачи с minimal данными', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({ title: 'Минимальная' });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('todo');
            expect(res.body.priority).toBe('medium');
            expect(res.body.description).toBe('');
        });

        test('ошибка 400 при пустом title', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({ title: '' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /api/tasks — Получение списка', () => {
        test('возврат пустого списка', async () => {
            const res = await request(app).get('/api/tasks');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        test('возврат списка с задачами', async () => {
            await request(app).post('/api/tasks').send({ title: 'A' });
            await request(app).post('/api/tasks').send({ title: 'B' });

            const res = await request(app).get('/api/tasks');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        test('фильтрация по статусу', async () => {
            await request(app).post('/api/tasks').send({ title: 'A' });
            const task = (await request(app).post('/api/tasks').send({ title: 'B' })).body;
            await request(app).patch(`/api/tasks/${task.id}/status`).send({ status: 'done' });

            const res = await request(app).get('/api/tasks?status=done');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].status).toBe('done');
        });
    });

    describe('GET /api/tasks/:id — Получение по ID', () => {
        test('получение существующей задачи', async () => {
            const created = (await request(app).post('/api/tasks').send({ title: 'Найди' })).body;
            const res = await request(app).get(`/api/tasks/${created.id}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(created.id);
            expect(res.body.title).toBe('Найди');
        });

        test('ошибка 404 при несуществующем ID', async () => {
            const res = await request(app).get('/api/tasks/99999');
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Task not found');
        });
    });

    describe('PUT /api/tasks/:id — Обновление', () => {
        test('обновление задачи', async () => {
            const task = (await request(app).post('/api/tasks').send({ title: 'Старое' })).body;
            const res = await request(app)
                .put(`/api/tasks/${task.id}`)
                .send({ title: 'Новое', priority: 'low' });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Новое');
            expect(res.body.priority).toBe('low');
        });

        test('ошибка 404 при обновлении несуществующей', async () => {
            const res = await request(app).put('/api/tasks/99999').send({ title: 'X' });
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/tasks/:id/status — Смена статуса', () => {
        test('установка статуса in_progress', async () => {
            const task = (await request(app).post('/api/tasks').send({ title: 'Задача' })).body;
            const res = await request(app)
                .patch(`/api/tasks/${task.id}/status`)
                .send({ status: 'in_progress' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBeDefined();

            const check = await request(app).get(`/api/tasks/${task.id}`);
            expect(check.body.status).toBe('in_progress');
        });

        test('ошибка 400 при невалидном статусе', async () => {
            const task = (await request(app).post('/api/tasks').send({ title: 'X' })).body;
            const res = await request(app)
                .patch(`/api/tasks/${task.id}/status`)
                .send({ status: 'invalid' });
            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/tasks/:id — Удаление', () => {
        test('удаление задачи', async () => {
            const task = (await request(app).post('/api/tasks').send({ title: 'Удалить' })).body;
            const res = await request(app).delete(`/api/tasks/${task.id}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Задача удалена');

            const check = await request(app).get(`/api/tasks/${task.id}`);
            expect(check.status).toBe(404);
        });

        test('ошибка 404 при удалении несуществующей', async () => {
            const res = await request(app).delete('/api/tasks/99999');
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/tasks/search — Поиск', () => {
        test('поиск по названию', async () => {
            await request(app).post('/api/tasks').send({ title: 'Купить продукты' });
            await request(app).post('/api/tasks').send({ title: 'Написать код' });

            const res = await request(app).get('/api/tasks/search?query=продукты');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toContain('продукты');
        });

        test('поиск по описанию', async () => {
            await request(app).post('/api/tasks').send({ title: 'Задача', description: 'Купить молоко' });
            const res = await request(app).get('/api/tasks/search?query=молоко');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });

        test('пустой запрос возвращает все', async () => {
            await request(app).post('/api/tasks').send({ title: 'A' });
            const res = await request(app).get('/api/tasks/search?query=');
            expect(res.body.length).toBe(1);
        });
    });

    describe('GET /api/tasks/statistics — Статистика', () => {
        test('корректная статистика', async () => {
            await request(app).post('/api/tasks').send({ title: 'A' });
            const t1 = (await request(app).post('/api/tasks').send({ title: 'B' })).body;
            const t2 = (await request(app).post('/api/tasks').send({ title: 'C' })).body;
            await request(app).patch(`/api/tasks/${t1.id}/status`).send({ status: 'done' });
            await request(app).patch(`/api/tasks/${t2.id}/status`).send({ status: 'in_progress' });

            const res = await request(app).get('/api/tasks/statistics');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ total: 3, todo: 1, in_progress: 1, done: 1 });
        });

        test('пустая статистика', async () => {
            const res = await request(app).get('/api/tasks/statistics');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ total: 0, todo: 0, in_progress: 0, done: 0 });
        });
    });

    describe('Интеграционный сценарий — полный цикл', () => {
        test('создание → обновление → смена статуса → удаление', async () => {
            // Создание
            const created = (await request(app)
                .post('/api/tasks')
                .send({ title: 'Полный цикл', priority: 'high' })).body;
            expect(created.id).toBeDefined();

            // Обновление
            const updated = (await request(app)
                .put(`/api/tasks/${created.id}`)
                .send({ title: 'Обновлённая', description: 'Новое описание' })).body;
            expect(updated.title).toBe('Обновлённая');

            // Смена статуса
            await request(app)
                .patch(`/api/tasks/${created.id}/status`)
                .send({ status: 'in_progress' });
            const inProgress = (await request(app).get(`/api/tasks/${created.id}`)).body;
            expect(inProgress.status).toBe('in_progress');

            // Удаление
            await request(app).delete(`/api/tasks/${created.id}`);
            const deleted = await request(app).get(`/api/tasks/${created.id}`);
            expect(deleted.status).toBe(404);
        });
    });
});
