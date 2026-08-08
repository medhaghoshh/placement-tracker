// Lets the logged-in user update their basic profile details.
const db = require('../config/db');
const dbErrorMessage = require('../config/dbError');

// PUT /api/profile  (protected)
exports.updateProfile = async (req, res) => {
  try {
    const { name, college, branch, graduation_year } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    await db.query(
      `UPDATE users SET name = ?, college = ?, branch = ?, graduation_year = ?
       WHERE id = ?`,
      [name, college || null, branch || null, graduation_year || null, req.user.id]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};
