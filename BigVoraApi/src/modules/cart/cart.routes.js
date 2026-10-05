const router = require('express').Router();
const controller = require('./cart.controller');
const {requireAuth} = require('../../middleware/auth.middleware');

router.use(requireAuth);
router.get('/', controller.list);
router.patch('/items/:productId', controller.setQuantity);
router.delete('/', controller.clear);

module.exports = router;
