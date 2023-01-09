const express = require("express");
const mongoose = require("mongoose");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const bodyParser = require("body-parser");
const multer = require("multer");

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

mongoose
  .connect(
    `mongodb+srv://psychoticOwlEyes888:eyesWideShut123@cluster0.czn6dqq.mongodb.net/brd-print-shop?retryWrites=true&w=majority`
  )
  .then((result) => {
    console.log("CONNECTED TO MONGODB");
    app.listen(8080);
  })
  .catch((error) => {
    console.log(error);
  });
