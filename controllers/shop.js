const Product = require("../models/product");
const Order = require("../models/order");
const dotenv = require("dotenv");

dotenv.config({ path: "./vars/.env" });

// FETCHES ALL THE PRODUCTS FOR THE SHOP
exports.getProducts = async (req, res, next) => {
  const products = await Product.find();

  res.status(201).json({ message: "Products Fetched!", products: products });
};

// Fetches single product for details page
exports.getProductDetail = async (req, res, next) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId);

  res.status(201).json({ message: "Product found", product: product });
};

// Creates a new order
exports.postSubmitOrderNoAccount = (req, res, next) => {
  console.log("order-data", req.body);
  const userCart = req.body.userCart;
  const billingData = req.body.billingData;
  const shippingData = req.body.shippingData;

  const userCartUpdated = userCart.map((item) => {
    return {
      productId: item.id,
      title: item.title,
      price: item.price,
      stock: item.stock,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
    };
  });

  userCartUpdated.forEach((item) => {
    Product.findById(item.productId).then((prod) => {
      if (prod.stock === 0) {
        console.log("OUT OF STOCK");
        return;
      }
      prod.stock = item.stock;
      prod.save();
    });
  });

  // CALCULATES TOTALPRICE AND TOTALITEMS OF ORDER
  let totalPrice = 0;
  let totalItems = 0;
  userCartUpdated.forEach((item) => {
    totalPrice = totalPrice + item.price * item.quantity;
    totalItems = totalItems + item.quantity;
  });

  const orderTotalPrice = Math.round((totalPrice + Number.EPSILON) * 100) / 100;

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

  newOrder.save();

  res.status(200).json({ message: "Your order has been received!" });
};
