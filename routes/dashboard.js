const express = require('express');
const router = express.Router();

// Dashboard home
router.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    user: req.session.user
  });
});

module.exports = router;
