const express = require("express");
const router = express.Router();
const tagsController = require("../controller/tags.controller");
router.get("/", tagsController.getTags);
module.exports = router;
