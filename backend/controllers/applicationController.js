// Handles CRUD for applications plus dashboard stats and upcoming events.
// Every query is scoped by user_id so users only ever see their own data.
const db = require('../config/db');
const dbErrorMessage = require('../config/dbError');

// GET /api/applications  (protected)
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// GET /api/applications/stats  (protected)
// Declared before /:id in the route file so "stats" isn't read as an id.
exports.getStats = async (req, res) => {
  try {
    const uid = req.user.id;

    // KPI counts
    const [[totals]] = await db.query(
      'SELECT COUNT(*) AS total FROM applications WHERE user_id = ?',
      [uid]
    );
    const [[active]] = await db.query(
      `SELECT COUNT(*) AS active FROM applications
       WHERE user_id = ? AND status IN ('Applied','Assessment','Interview','On Hold')`,
      [uid]
    );
    const [[interviews]] = await db.query(
      `SELECT COUNT(*) AS interviews FROM applications
       WHERE user_id = ? AND status = 'Interview'`,
      [uid]
    );
    const [[offers]] = await db.query(
      `SELECT COUNT(*) AS offers FROM applications
       WHERE user_id = ? AND status = 'Selected'`,
      [uid]
    );

    // Status distribution for the doughnut chart
    const [statusRows] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM applications WHERE user_id = ? GROUP BY status`,
      [uid]
    );

    // Funnel counts (Applications -> Assessments -> Interviews -> Offers)
    const [[funnel]] = await db.query(
      `SELECT
         COUNT(*) AS applications,
         SUM(status = 'Assessment') AS assessments,
         SUM(status = 'Interview')  AS interviews,
         SUM(status = 'Selected')   AS offers
       FROM applications WHERE user_id = ?`,
      [uid]
    );

    // Applications per month (based on application_date, current year window)
    const [monthlyRows] = await db.query(
      `SELECT MONTH(application_date) AS month, COUNT(*) AS count
       FROM applications
       WHERE user_id = ? AND application_date IS NOT NULL
       GROUP BY MONTH(application_date)
       ORDER BY month`,
      [uid]
    );

    res.json({
      kpis: {
        total: totals.total,
        active: active.active,
        interviews: interviews.interviews,
        offers: offers.offers,
      },
      statusDistribution: statusRows,
      funnel: {
        applications: Number(funnel.applications) || 0,
        assessments: Number(funnel.assessments) || 0,
        interviews: Number(funnel.interviews) || 0,
        offers: Number(funnel.offers) || 0,
      },
      monthly: monthlyRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// GET /api/applications/upcoming  (protected)
// Returns future assessment dates, interview dates and deadlines, sorted by nearest.
exports.getUpcoming = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, company_name, job_role,
              'Online Assessment' AS event, assessment_date AS event_date
         FROM applications
        WHERE user_id = ? AND assessment_date IS NOT NULL AND assessment_date >= CURDATE()
      UNION ALL
       SELECT id, company_name, job_role,
              'Interview' AS event, interview_date AS event_date
         FROM applications
        WHERE user_id = ? AND interview_date IS NOT NULL AND interview_date >= CURDATE()
      UNION ALL
       SELECT id, company_name, job_role,
              'Application Deadline' AS event, application_deadline AS event_date
         FROM applications
        WHERE user_id = ? AND application_deadline IS NOT NULL AND application_deadline >= CURDATE()
       ORDER BY event_date ASC`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// GET /api/applications/:id  (protected)
exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// Turn empty strings into null so DATE columns stay valid.
function clean(v) {
  return v === '' || v === undefined ? null : v;
}

// POST /api/applications  (protected)
exports.create = async (req, res) => {
  try {
    const b = req.body;
    if (!b.company_name || !b.job_role || !b.application_date || !b.status) {
      return res.status(400).json({
        message: 'Company, role, application date and status are required.',
      });
    }

    const [result] = await db.query(
      `INSERT INTO applications
        (user_id, company_name, job_role, job_type, location, package,
         application_date, application_deadline, status, current_round,
         assessment_date, interview_date, job_link, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        b.company_name,
        b.job_role,
        clean(b.job_type) || 'Full Time',
        clean(b.location),
        clean(b.package),
        clean(b.application_date),
        clean(b.application_deadline),
        b.status,
        clean(b.current_round) || 'Application',
        clean(b.assessment_date),
        clean(b.interview_date),
        clean(b.job_link),
        clean(b.notes),
      ]
    );

    res.status(201).json({ message: 'Application added successfully.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// PUT /api/applications/:id  (protected)
exports.update = async (req, res) => {
  try {
    const b = req.body;
    if (!b.company_name || !b.job_role || !b.application_date || !b.status) {
      return res.status(400).json({
        message: 'Company, role, application date and status are required.',
      });
    }

    const [result] = await db.query(
      `UPDATE applications SET
         company_name = ?, job_role = ?, job_type = ?, location = ?, package = ?,
         application_date = ?, application_deadline = ?, status = ?, current_round = ?,
         assessment_date = ?, interview_date = ?, job_link = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        b.company_name,
        b.job_role,
        clean(b.job_type) || 'Full Time',
        clean(b.location),
        clean(b.package),
        clean(b.application_date),
        clean(b.application_deadline),
        b.status,
        clean(b.current_round) || 'Application',
        clean(b.assessment_date),
        clean(b.interview_date),
        clean(b.job_link),
        clean(b.notes),
        req.params.id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.json({ message: 'Application updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};

// DELETE /api/applications/:id  (protected)
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM applications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.json({ message: 'Application deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: dbErrorMessage(err) });
  }
};
