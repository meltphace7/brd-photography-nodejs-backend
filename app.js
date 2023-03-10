const express = require("express");
const mongoose = require("mongoose");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const bodyParser = require("body-parser");
const multer = require("multer");
const helmet = require("helmet");
const dotenv = require("dotenv");

const port = process.env.PORT || 8080;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

dotenv.config({ path: "./vars/.env" });

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/shop", shopRoutes);
app.use("/auth", authRoutes);
app.use("/admin", upload.single("image"), adminRoutes);
app.use(helmet());

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});


//Connect to the database before listening
connectDB().then(() => {
    app.listen(port, () => {
        console.log("listening for requests");
    })
})
