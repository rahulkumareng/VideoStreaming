const express = require("express");
const cors = require("cors");
const path = require('path');
const uploadRoutes = require("./routes/upload.routes.js");
const videoRoutes = require("./routes/video.routes.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/uploads", uploadRoutes);
app.use("/api/videos", videoRoutes);

module.exports = app;