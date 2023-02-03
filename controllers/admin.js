const Product = require("../models/product");
const Order = require("../models/order");
const { validationResult } = require("express-validator");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config({ path: "./vars/.env" });

// s3 account data
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

// CONFIGURES s3 object so the image can be stored
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

/////////////////  CONTROLLERS ///////////////////

// Check if user is Admin
exports.postcheckIsAdmin = (req, res, next) => {
    console.log('isAdmin', req.isAdmin)
    if (req.isAdmin) {
        res.status(201).json({ message:'Admin login succesfull!' ,isAdmin: true });
    } else {
        res
          .status(400)
          .json({ message: "Admin login failed!" });
    }
}

// Admin creates a product
exports.postAddProduct = (req, res, next) => {
    console.log(req.body);
    console.log(req.file);
  const randomImageName = (bytes = 32) =>
    crypto.randomBytes(bytes).toString("hex");

  const imageName = randomImageName();
  // resize uploaded image before being sent to S3
  // const resizedImage = await sharp(req.file.buffer)
  //   .resize({ width: 1000, fit: "contain" })
  //   .toBuffer();
  const imageUrl = `https://brdphotography-image-bucket.s3.us-west-2.amazonaws.com/${imageName}`;

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };
  const command = new PutObjectCommand(params);
  s3.send(command);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please Enter a valid product!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  if (!req.file) {
    const error = new Error("No image provided!");
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  const stock = req.body.stock;

  const newProduct = new Product({
    title: title,
    price: price,
    stock: stock,
    description: description,
    imageUrl: imageUrl
  });
  newProduct
    .save()
    .then((result) => {
      res.status(201).json({ message: "Product Created!" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

//Gets product data for Admin to edit
exports.postGetEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      res.status(201).json({ message: "Product found", product: product });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Replaces old product data with edited product data
exports.postEditProduct = (req, res, next) => {
  console.log('EDIT body', req.body)
  const image = req.file;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please Enter a valid product!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const productId = req.body._id;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedStock = req.body.stock;
  const updatedDescription = req.body.description;
  let updatedImageUrl;

  if (req.file) {
    const randomImageName = (bytes = 32) =>
      crypto.randomBytes(bytes).toString("hex");

    const imageName = randomImageName();
       const imageUrl = `https://brdphotography-image-bucket.s3.us-west-2.amazonaws.com/${imageName}`;
    updatedImageUrl = imageUrl;

    const params = {
      Bucket: bucketName,
      Key: imageName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    const command = new PutObjectCommand(params);
    s3.send(command);
  }

  Product.findById(productId)
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.stock = updatedStock;
      product.description = updatedDescription;
      product.imageUrl = image ? updatedImageUrl : product.imageUrl
      return product.save();
    })
    .then((result) => {
      res.status(201).json({ message: "Product edited successfully" });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Deletes a product from DB
exports.postDeleteProduct = (req, res, next) => {
  console.log('delete body', req.body)
  const productId = req.body.productId;
  const imageUrl = req.body.imageUrl;
  const imageName = imageUrl.slice(63);
  console.log(productId);
  console.log(imageName);

  // DELETES IMAGE FROM s3 BUCKET
  const deleteImage = async () => {
    const params = {
      Bucket: bucketName,
      Key: imageName,
    };
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  };
  deleteImage();

  // DELETES PRODUCT FROM MONGO
  Product.findByIdAndRemove(productId)
    .then((result) => {
      console.log(result);
      res.status(200).json({ message: "Product Deleted!" });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Gets user's orders
exports.postGetOrders = (req, res, next) => {
  console.log("ADMIN GET ORDERS");
  Order.find()
    .then((orders) => {
      if (!orders) {
        const error = new Error("No Orders Found!");
        error.statusCode = 404;
        throw error;
      }

      const openOrders = orders.filter((order) => order.fulfilled !== true);
      // SORTS BY DATE - LASTEST TO OLDEST
      const byDate = (a, b) => {
        let d1 = new Date(a.date.slice(0, -1));
        let d2 = new Date(b.date.slice(0, -1));
        return d2.valueOf() - d1.valueOf();
      };

      const sortedOrders = openOrders.sort(byDate);

      res
        .status(201)
        .json({ message: "Orders Fetched!", orders: sortedOrders });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Marks a user's order as fufilled
exports.postfufillOrder = (req, res, next) => {
  console.log("FUFILL ORDER");
  const orderId = req.body.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (order.fulfilled === false) {
        order.fulfilled = true;
      } else {
        order.fulfilled = false;
      }
      order.save();
    })
    .then((result) => {
      res.status(200).json({ message: "Order has fulfilled!" });
    })
    .catch((err) => {
      console.log(err);
    });
};
