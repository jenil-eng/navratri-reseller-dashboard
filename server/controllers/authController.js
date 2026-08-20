const jwt = require('jsonwebtoken');

const AUTH_SECRET = process.env.AUTH_SECRET || 'navratri_secret_jwt_key_2026_reseller_secure';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@navratri.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const targetEmail = ADMIN_EMAIL.trim().toLowerCase();

  if (cleanEmail === targetEmail && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { email: cleanEmail, role: 'admin' },
      AUTH_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        email: cleanEmail,
        name: 'Navratri Reseller Admin',
        role: 'admin'
      }
    });
  }

  return res.status(401).json({ message: 'Invalid credentials. Check email or password.' });
};

exports.verifySession = (req, res) => {
  return res.json({
    valid: true,
    user: req.user
  });
};
