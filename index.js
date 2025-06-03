// 📁 server.js (Entry point)
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("./utils/cloudinary");
require("dotenv").config(); 

const app = express();
const port = 5000;
app.use(cors({
  origin: ['https://internshipformfrontend.onrender.com', 'http://localhost:5173', 'https://internshipform.mindclubfoundation.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
const {
  appendApplicationData,
  getColleges,
  getCourses,
  interestAreas,
  references,
} = require("./googleSheetService");
const paymentRoutes = require('./routes/payment');





app.use('/api/payment', paymentRoutes);


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Route: Submit Application Form
app.post("/api/apply", async (req, res) => {
  try {
    console.log("req.body", req.body);
    // let profilePictureUrl = "";

    // if (req.file) {
    //   const result = await cloudinary.uploader.upload_stream(
    //     { folder: "internship_applications", resource_type: "image" },
    //     async (error, result) => {
    //       if (error){
    //         console.log("error form cloudinary", error);

    //         throw new Error("Cloudinary upload failed");
    //       } 
    //       profilePictureUrl = result.secure_url;
    //       await appendApplicationData(req.body);
    //       res.json({ message: "Application submitted!" });
    //     }
    //   );
    //   result.end(req.file.buffer);
    // } else {
      await appendApplicationData(req.body);
      res.json({ message: "Application submitted!" });
    // }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Route: Get List of Colleges
app.get("/api/colleges", async (req, res) => {
  try {
    const colleges = await getColleges();
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await getCourses();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/interest-areas", async (req, res) => {
  try {
    const courses = await interestAreas();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/references", async (req, res) => {
  try {
    const courses = await references();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
