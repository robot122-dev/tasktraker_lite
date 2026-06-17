const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'tasktracker',
    password: process.env.DB_PASSWORD || 'tasktracker123',
    database: process.env.DB_NAME || 'users'
});

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);
}

// GET /api/users
app.get('/api/users', async (req, res) => {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.json(result.rows);
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
});

// POST /api/users
app.post('/api/users', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        if (e.code === '23505') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        throw e;
    }
});

// PUT /api/users/:id
app.put('/api/users/:id', async (req, res) => {
    const { name, email } = req.body;
    const result = await pool.query(
        'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *',
        [name, email, req.params.id]
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
});

// DELETE /api/users/:id
app.delete('/api/users/:id', async (req, res) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`User Service: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('DB init failed:', err.message);
    process.exit(1);
});
