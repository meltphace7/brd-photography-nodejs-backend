const express = require("express");
const shopController = require("../controllers/shop");

const router = express.Router();

router.get("/products", shopController.getProducts);

router.get("/product-detail/:productId", shopController.getProductDetail);

router.post(
  "/submit-order-no-account",
  shopController.postSubmitOrderNoAccount
);

module.exports = router;
