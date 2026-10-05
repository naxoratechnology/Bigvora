const router = require('express').Router();
const {requireAuth} = require('../../middleware/auth.middleware');
const controller = require('./notification.controller');

router.use(requireAuth);
router.get('/', controller.list);
router.post('/read-all', controller.readAll);

module.exports = router;
