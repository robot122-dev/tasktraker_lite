const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory storage
let tasks = [];
let nextId = 1;

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TaskTracker Lite API',
            version: '1.0.0',
            description: 'REST API для управления задачами'
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            schemas: {
                Task: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Подготовить отчет' },
                        description: { type: 'string', example: 'Сформировать отчет по проекту' },
                        status: { type: 'string', enum: ['todo', 'in_progress', 'done'], example: 'todo' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                TaskInput: {
                    type: 'object',
                    required: ['title'],
                    properties: {
                        title: { type: 'string', example: 'Новая задача' },
                        description: { type: 'string', example: 'Описание задачи' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' }
                    }
                },
                TaskUpdate: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        status: { type: 'string', enum: ['todo', 'in_progress', 'done'] },
                        priority: { type: 'string', enum: ['low', 'medium', 'high'] }
                    }
                },
                StatusUpdate: {
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: { type: 'string', enum: ['todo', 'in_progress', 'done'] }
                    }
                },
                Statistics: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer', example: 15 },
                        todo: { type: 'integer', example: 5 },
                        in_progress: { type: 'integer', example: 6 },
                        done: { type: 'integer', example: 4 }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Task not found' }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Задача удалена' }
                    }
                }
            }
        }
    },
    apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Validation helpers
const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function validateTaskInput(body) {
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
        return 'Title is required';
    }
    if (body.title.length > 200) {
        return 'Title is too long';
    }
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
        return 'Invalid priority';
    }
    if (body.status && !VALID_STATUSES.includes(body.status)) {
        return 'Invalid status';
    }
    return null;
}

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Получение всех задач
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         description: Фильтр по статусу
 *     responses:
 *       200:
 *         description: Список задач
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
app.get('/api/tasks', (req, res) => {
    let result = tasks;
    if (req.query.status) {
        if (!VALID_STATUSES.includes(req.query.status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        result = result.filter(t => t.status === req.query.status);
    }
    res.json(result);
});

/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     summary: Поиск задач
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Поисковый запрос
 *     responses:
 *       200:
 *         description: Результаты поиска
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
app.get('/api/tasks/search', (req, res) => {
    const query = (req.query.query || '').toLowerCase().trim();
    if (!query) {
        return res.json(tasks);
    }
    const result = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
    );
    res.json(result);
});

/**
 * @swagger
 * /api/tasks/statistics:
 *   get:
 *     summary: Статистика задач
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Статистика
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistics'
 */
app.get('/api/tasks/statistics', (req, res) => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    res.json({ total, todo, in_progress: inProgress, done });
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Получение задачи по ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Задача найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Задача не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Создание задачи
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Задача создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/tasks', (req, res) => {
    const error = validateTaskInput(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    const task = {
        id: nextId++,
        title: req.body.title.trim(),
        description: (req.body.description || '').trim(),
        status: 'todo',
        priority: req.body.priority || 'medium',
        createdAt: new Date().toISOString()
    };
    tasks.push(task);
    res.status(201).json(task);
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Обновление задачи
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskUpdate'
 *     responses:
 *       200:
 *         description: Задача обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Задача не найдена
 */
app.put('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const error = validateTaskInput({ ...task, ...req.body });
    if (error) {
        return res.status(400).json({ error });
    }

    if (req.body.title !== undefined) task.title = req.body.title.trim();
    if (req.body.description !== undefined) task.description = req.body.description.trim();
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.priority !== undefined) task.priority = req.body.priority;

    res.json(task);
});

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Изменение статуса задачи
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusUpdate'
 *     responses:
 *       200:
 *         description: Статус изменен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Статус успешно изменен
 *       400:
 *         description: Неверный статус
 *       404:
 *         description: Задача не найдена
 */
app.patch('/api/tasks/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (!req.body.status || !VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    task.status = req.body.status;
    res.json({ message: 'Статус успешно изменен' });
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Удаление задачи
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Задача удалена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       404:
 *         description: Задача не найдена
 */
app.delete('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    tasks.splice(index, 1);
    res.json({ message: 'Задача удалена' });
});

// Export for testing
function getTasks() { return tasks; }
function setTasks(newTasks) { tasks = newTasks; }
function resetId() { nextId = 1; }

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`TaskTracker Lite API: http://localhost:${PORT}`);
        console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
}

module.exports = { app, getTasks, setTasks, resetId };
