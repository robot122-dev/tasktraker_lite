const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'tasktracker',
    password: process.env.DB_PASSWORD || 'tasktracker123',
    database: process.env.DB_NAME || 'notifications'
});

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            read BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
}

// GET /api/notifications
app.get('/api/notifications', async (req, res) => {
    let query = 'SELECT * FROM notifications';
    const params = [];
    if (req.query.user_id) {
        query += ' WHERE user_id = $1';
        params.push(req.query.user_id);
    }
    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
});

// GET /api/notifications/:id
app.get('/api/notifications/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
});

// POST /api/notifications
app.post('/api/notifications', async (req, res) => {
    const { user_id, message, type } = req.body;
    if (!user_id || !message) {
        return res.status(400).json({ error: 'user_id and message are required' });
    }
    const result = await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *',
        [user_id, message, type || 'info']
    );
    console.log(`[Notification] User ${user_id}: ${message}`);
    res.status(201).json(result.rows[0]);
});

// PATCH /api/notifications/:id/read
app.patch('/api/notifications/:id/read', async (req, res) => {
    const result = await pool.query(
        'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
        [req.params.id]
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
});

// DELETE /api/notifications/:id
app.delete('/api/notifications/:id', async (req, res) => {
    const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
});

// GET /api/notifications/unread/:userId
app.get('/api/notifications/unread/:userId', async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY id DESC',
        [req.params.userId]
    );
    res.json(result.rows);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'notification-service' });
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Notification Service: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('DB init failed:', err.message);
    process.exit(1);
});
