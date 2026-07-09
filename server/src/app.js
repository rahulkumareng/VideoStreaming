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

// Serve Vite static assets
const clientDistPath = path.join(__dirname, '../../client/dist');

app.use(express.static(clientDistPath, {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  index: false       // Prevent auto-serving index.html for asset paths
}));

// ✅ ALTERNATIVE (Safest)
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

module.exports = app;