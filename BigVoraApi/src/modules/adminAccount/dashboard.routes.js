const router = require("express").Router();
const { requireAdmin } = require("../../middleware/admin.middleware");
const controller = require("./dashboard.controller");

router.use(requireAdmin);
router.get("/", controller.summary);

module.exports = router;
