const express = require("express");
const router = express.Router();
const {
  getSubjectsController
} = require("./subject.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/subjects", authMiddleware, getSubjectsController);


router.get("/subjects", getSubjectsController);


module.exports = router;





