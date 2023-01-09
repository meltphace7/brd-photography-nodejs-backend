const express = require("express");
const mongoose = require("mongoose");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const bodyParser = require("body-parser");
const multer = require("multer");
const helmet = require("helmet");
const dotenv = require("dotenv");

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

const mongoDbURI = process.env.MONGODB_URI;

const port = process.env.PORT || 8080;

mongoose
  .connect(mongoDbURI)
  .then((result) => {
    console.log("CONNECTED TO MONGODB");
    app.listen(port);
  })
  .catch((error) => {
    console.log(error);
  });
