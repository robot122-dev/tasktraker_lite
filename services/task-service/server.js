const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'tasktracker',
    password: process.env.DB_PASSWORD || 'tasktracker123',
    database: process.env.DB_NAME || 'tasks'
});

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT DEFAULT '',
            status VARCHAR(20) DEFAULT 'todo',
            priority VARCHAR(20) DEFAULT 'medium',
            user_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
}

// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
    let query = 'SELECT * FROM tasks';
    const params = [];
    if (req.query.status) {
        if (!VALID_STATUSES.includes(req.query.status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        query += ' WHERE status = $1';
        params.push(req.query.status);
    }
    if (req.query.user_id) {
        query += params.length ? ' AND' : ' WHERE';
        query += ` user_id = $${params.length + 1}`;
        params.push(req.query.user_id);
    }
    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    res.json(result.rows);
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
    const { title, description, priority, user_id } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority' });
    }

    // Проверяем существование пользователя через User Service (синхронный вызов)
    if (user_id) {
        try {
            await axios.get(`${USER_SERVICE_URL}/api/users/${user_id}`);
        } catch (e) {
            return res.status(400).json({ error: 'User not found' });
        }
    }

    const result = await pool.query(
        'INSERT INTO tasks (title, description, priority, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title.trim(), (description || '').trim(), priority || 'medium', user_id || null]
    );

    // Уведомление через Notification Service (асинхронный вызов)
    if (user_id) {
        axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
            user_id,
            message: `Создана новая задача: ${title}`,
            type: 'task_created'
        }).catch(() => {});
    }

    res.status(201).json(result.rows[0]);
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', async (req, res) => {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }
    const task = existing.rows[0];
    const title = req.body.title !== undefined ? req.body.title.trim() : task.title;
    const description = req.body.description !== undefined ? req.body.description.trim() : task.description;
    const status = req.body.status || task.status;
    const priority = req.body.priority || task.priority;

    if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
        'UPDATE tasks SET title=$1, description=$2, status=$3, priority=$4 WHERE id=$5 RETURNING *',
        [title, description, status, priority, req.params.id]
    );
    res.json(result.rows[0]);
});

// PATCH /api/tasks/:id/status
app.patch('/api/tasks/:id/status', async (req, res) => {
    if (!req.body.status || !VALID_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query(
        'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
        [req.body.status, req.params.id]
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }

    // Уведомление о смене статуса
    const task = result.rows[0];
    if (task.user_id) {
        axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
            user_id: task.user_id,
            message: `Статус задачи "${task.title}" изменён на "${req.body.status}"`,
            type: 'status_changed'
        }).catch(() => {});
    }

    res.json({ message: 'Status updated' });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
});

// GET /api/tasks/statistics
app.get('/api/tasks/statistics', async (req, res) => {
    const result = await pool.query(`
        SELECT
            COUNT(*)::int as total,
            COUNT(*) FILTER (WHERE status = 'todo')::int as todo,
            COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
            COUNT(*) FILTER (WHERE status = 'done')::int as done
        FROM tasks
    `);
    res.json(result.rows[0]);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'task-service' });
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Task Service: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('DB init failed:', err.message);
    process.exit(1);
});
