const router = require('express').Router();
const {requireAdmin} = require('../../middleware/admin.middleware');
const controller = require('./support-ticket.controller');
router.use(requireAdmin);
router.get('/', controller.adminList);
router.patch('/:id/status', controller.updateStatus);
module.exports = router;
