const router = require('express').Router();
const {requireAuth} = require('../../middleware/auth.middleware');
const controller = require('./support-ticket.controller');
router.use(requireAuth);
router.get('/', controller.listMine);
router.post('/', controller.create);
module.exports = router;
