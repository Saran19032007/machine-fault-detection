const express = require("express");
const router = express.Router();
const { getDeviceStatus } = require("../controllers/deviceController");

router.get("/", getDeviceStatus);

module.exports = router;
