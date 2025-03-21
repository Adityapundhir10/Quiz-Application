const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.json());
const dbConfig = require("./config/dbConfig");

const usersRoute = require("./routes/usersRoute");
const examsRoute = require("./routes/examsRoute");
const reportsRoute = require("./routes/reportsRoute");

app.use("/api/users", usersRoute);
app.use("/api/exams", examsRoute);
app.use("/api/reports", reportsRoute);

// -----------------
// Multer Upload Setup
// -----------------
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the "uploads" directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with the original file extension
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

// Create the upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }
  res.status(200).json({
    success: true,
    file: req.file,
    message: "File uploaded successfully",
  });
});
// Serve static files from the uploads folder so they can be viewed by users
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -----------------
// End of Multer Upload Setup
// -----------------

const port = process.env.PORT || 5000;

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  // Adjusted path: since this file is in /server, we go one level up to access /client/build
  app.use(express.static(path.join(__dirname, "..", "client", "build")));
  
  // For any route not matching an API endpoint, serve the React index.html file.
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "client", "build", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
