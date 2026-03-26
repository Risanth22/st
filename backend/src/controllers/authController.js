const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1 AND u.is_active = true',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role_name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role_name, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role_name, phone: req.user.phone } });
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, r.name as role FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (!roleResult.rows[0]) return res.status(400).json({ error: 'Invalid role' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role_id, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone',
      [name, email, hashed, roleResult.rows[0].id, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, is_active, role } = req.body;
    let roleId;
    if (role) {
      const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
      roleId = roleResult.rows[0]?.id;
    }
    await pool.query(
      'UPDATE users SET name = COALESCE($1,name), phone = COALESCE($2,phone), is_active = COALESCE($3,is_active), role_id = COALESCE($4,role_id) WHERE id = $5',
      [name, phone, is_active, roleId, id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
