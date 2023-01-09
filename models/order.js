const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  fulfilled: { type: Boolean, required: true },
  cart: { type: Array, required: true },
  totalItems: { type: Number, required: true },
  orderTotal: { type: Number, required: true },
  date: { type: String, required: true },
  user: {
    userId: { type: Schema.Types.ObjectId, required: false, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
  },
  billingData: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    country: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: Number, required: true },
  },
  shippingData: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    country: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: Number, required: true },
  },
});

module.exports = mongoose.model("Order", orderSchema);
