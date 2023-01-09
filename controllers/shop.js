const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const dotenv = require("dotenv");
// const { post } = require("../routes/auth");

dotenv.config({ path: "./vars/.env" });
  
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

// FETCHES ALL THE PRODUCTS FOR THE SHOP
exports.getProducts = async (req, res, next) => {
    const products = await Product.find();
  // Loop through products and create a imageURL based on the imageName
  for (const prod of products) {
    const getObjectParams = {
      Bucket: bucketName,
      Key: prod.imageName,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    prod.imageUrl = url;
  }

  res.status(201).json({ message: "Products Fetched!", products: products });
};

// Fetches single product for details page
exports.getProductDetail = async (req, res, next) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId);

  const getObjectParams = {
    Bucket: bucketName,
    Key: product.imageName,
  };
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  product.imageUrl = url;
  res.status(201).json({ message: "Product found", product: product });
};

exports.postSubmitOrderNoAccount = (req, res, next) => {
  const userCart = req.body.userCart;
  const billingData = req.body.billingData;
  const shippingData = req.body.shippingData;
  const userCartUpdated = userCart.map((item) => {
    return {
      productId: item.id,
      title: item.title,
      price: item.price,
      stock: item.stock,
      imageName: item.imageName,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
    };
  });

  userCartUpdated.forEach((item) => {
    Product.findById(item.productId)
      .then((prod) => {
        if (prod.stock === 0) {
          console.log("OUT OF STOCK");
          return;
        }
        prod.stock = item.stock;
        prod.save();
      })
      .then((result) => {
        // CALCULATES TOTALPRICE AND TOTALITEMS OF ORDER
        let totalPrice = 0;
        let totalItems = 0;
        userCartUpdated.forEach((item) => {
          totalPrice = totalPrice + item.price * item.quantity;
          totalItems = totalItems + item.quantity;
        });

        const orderTotalPrice =
          Math.round((totalPrice + Number.EPSILON) * 100) / 100;

        const date = new Date().toISOString();

        const newOrder = new Order({
          fulfilled: false,
          cart: userCartUpdated,
          date: date,
          totalItems: totalItems,
          orderTotal: orderTotalPrice,
          user: {
            firstName: billingData.firstName,
            lastName: billingData.lastName,
            email: billingData.email,
          },
          billingData: {
            firstName: billingData.firstName,
            lastName: billingData.lastName,
            email: billingData.email,
            phoneNumber: billingData.phoneNumber,
            country: billingData.country,
            streetAddress: billingData.streetAddress,
            city: billingData.city,
            state: billingData.state,
            postalCode: billingData.postalCode,
          },
          shippingData: {
            firstName: shippingData.firstName,
            lastName: shippingData.lastName,
            country: shippingData.country,
            streetAddress: shippingData.streetAddress,
            city: shippingData.city,
            state: shippingData.state,
            postalCode: shippingData.postalCode,
          },
        });

        return newOrder.save();
      })
      .then((result) => {
        res.status(200).json({ message: "Your order has been received!" });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};