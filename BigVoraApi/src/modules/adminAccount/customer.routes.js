const router = require("express").Router();
const { requireAdmin } = require("../../middleware/admin.middleware");
const controller = require("./customer.controller");

router.use(requireAdmin);
router.get("/", controller.list);
router.get("/:id", controller.detail);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.remove);

module.exports = router;
