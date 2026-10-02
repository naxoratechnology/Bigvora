const router = require('express').Router();
const controller = require('./favourite.controller');
const {requireAuth} = require('../../middleware/auth.middleware');
router.use(requireAuth);
router.get('/', controller.list);
router.post('/:productId', controller.add);
router.delete('/:productId', controller.remove);
module.exports = router;
