const express = require("express");
const router = express.Router();
const { listAlerts } = require("../controllers/alertController");

router.get("/", listAlerts);

module.exports = router;
