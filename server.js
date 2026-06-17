const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Database config
const useDB = process.env.DB_HOST;
let pool = null;

if (useDB) {
    pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
}

// In-memory storage (fallback)
let tasks = [];
let nextId = 1;

async function initDB() {
    if (!pool) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT DEFAULT '',
            status VARCHAR(20) DEFAULT 'todo',
            priority VARCHAR(20) DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
}

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

// Reset (for testing)
app.post('/api/tasks/reset', (req, res) => {
    tasks = [];
    nextId = 1;
    res.json({ message: 'Reset complete' });
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
app.get('/api/tasks', async (req, res) => {
    if (pool) {
        let query = 'SELECT id, title, description, status, priority, created_at as "createdAt" FROM tasks';
        const params = [];
        if (req.query.status) {
            if (!VALID_STATUSES.includes(req.query.status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            query += ' WHERE status = $1';
            params.push(req.query.status);
        }
        query += ' ORDER BY id';
        const result = await pool.query(query, params);
        return res.json(result.rows);
    }
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
app.get('/api/tasks/search', async (req, res) => {
    const query = (req.query.query || '').toLowerCase().trim();
    if (pool) {
        if (!query) {
            const result = await pool.query('SELECT id, title, description, status, priority, created_at as "createdAt" FROM tasks ORDER BY id');
            return res.json(result.rows);
        }
        const result = await pool.query(
            'SELECT id, title, description, status, priority, created_at as "createdAt" FROM tasks WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1 ORDER BY id',
            ['%' + query + '%']
        );
        return res.json(result.rows);
    }
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
app.get('/api/tasks/statistics', async (req, res) => {
    if (pool) {
        const result = await pool.query(`
            SELECT
                COUNT(*)::int as total,
                COUNT(*) FILTER (WHERE status = 'todo')::int as todo,
                COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
                COUNT(*) FILTER (WHERE status = 'done')::int as done
            FROM tasks
        `);
        return res.json(result.rows[0]);
    }
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
app.get('/api/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (pool) {
        const result = await pool.query(
            'SELECT id, title, description, status, priority, created_at as "createdAt" FROM tasks WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        return res.json(result.rows[0]);
    }
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
app.post('/api/tasks', async (req, res) => {
    const error = validateTaskInput(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    if (pool) {
        const result = await pool.query(
            'INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING id, title, description, status, priority, created_at as "createdAt"',
            [req.body.title.trim(), (req.body.description || '').trim(), 'todo', req.body.priority || 'medium']
        );
        return res.status(201).json(result.rows[0]);
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
app.put('/api/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (pool) {
        const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        const task = existing.rows[0];
        const error = validateTaskInput({ title: req.body.title || task.title, ...req.body });
        if (error) return res.status(400).json({ error });

        const title = req.body.title !== undefined ? req.body.title.trim() : task.title;
        const description = req.body.description !== undefined ? req.body.description.trim() : task.description;
        const status = req.body.status || task.status;
        const priority = req.body.priority || task.priority;

        const result = await pool.query(
            'UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4 WHERE id=$5 RETURNING id, title, description, status, priority, created_at as "createdAt"',
            [title, description, status, priority, id]
        );
        return res.json(result.rows[0]);
    }

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
app.patch('/api/tasks/:id/status', async (req, res) => {
    const id = parseInt(req.params.id);

    if (!req.body.status || !VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    if (pool) {
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING id',
            [req.body.status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        return res.json({ message: 'Статус успешно изменен' });
    }

    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
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
app.delete('/api/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (pool) {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        return res.json({ message: 'Задача удалена' });
    }

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
    initDB().then(() => {
        app.listen(PORT, () => {
            console.log(`TaskTracker Lite API: http://localhost:${PORT}`);
            console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
            console.log(`Database: ${useDB ? 'PostgreSQL (' + useDB + ')' : 'In-Memory'}`);
        });
    }).catch(err => {
        console.error('Failed to init DB:', err.message);
        console.log('Falling back to in-memory storage');
        app.listen(PORT, () => {
            console.log(`TaskTracker Lite API: http://localhost:${PORT}`);
            console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
            console.log('Database: In-Memory (fallback)');
        });
    });
}

module.exports = { app, getTasks, setTasks, resetId };
