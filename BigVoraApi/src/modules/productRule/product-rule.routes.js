const router = require('express').Router();
const {requireAdmin} = require('../../middleware/admin.middleware');
const controller = require('./product-rule.controller');
router.use(requireAdmin);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);
module.exports = router;
