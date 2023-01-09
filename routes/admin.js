const express = require("express");
const { body } = require("express-validator");
const adminController = require(".././controllers/admin");

const isAuth = require("../middleware/auth");

const router = express.Router();

router.post("/check-admin", isAuth, adminController.postcheckIsAdmin);

router.post(
  "/add-product",
  isAuth,
  [
    body("title").trim().not().isEmpty(),
    body("price").trim().not().isEmpty(),
    body("stock").trim().not().isEmpty(),
    body("description").trim().not().isEmpty(),
  ],
  adminController.postAddProduct
);

router.post(
  "/edit-product/:productId",
  isAuth,
  adminController.postGetEditProduct
);

router.post(
  "/edit-product",
  isAuth,
  [
    body("title").trim().not().isEmpty(),
    body("price").trim().not().isEmpty(),
    body("stock").trim().not().isEmpty(),
    body("description").trim().not().isEmpty(),
  ],
  adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

router.post("/get-orders", isAuth, adminController.postGetOrders);

router.post("/fufill-order", isAuth, adminController.postfufillOrder);

module.exports = router;
