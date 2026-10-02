const router = require('express').Router();
const { requireAdmin } = require('../../middleware/admin.middleware');
const controller = require('./admin-order.controller');

router.use(requireAdmin);
router.get('/', controller.list);
router.get('/:id', controller.detail);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/sync-shipment', controller.syncShipment);

module.exports = router;
