const express = require('express');
const router = express.Router();
const app = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

// Every application route requires a valid token.
router.use(authMiddleware);

// Specific routes must come BEFORE the "/:id" route,
// otherwise "stats" / "upcoming" would be treated as an id.
router.get('/stats', app.getStats);
router.get('/upcoming', app.getUpcoming);

router.get('/', app.getAll);
router.post('/', app.create);
router.get('/:id', app.getOne);
router.put('/:id', app.update);
router.delete('/:id', app.remove);

module.exports = router;
