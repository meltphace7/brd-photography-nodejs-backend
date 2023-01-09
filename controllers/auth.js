const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { validationResult } = require("express-validator");

// LOGS IN USER WITH ENTERED USER INPUT
// SIGNS UP USER WITH VALIDATED USERINPUT
exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email: email,
        password: hashedPw,
        firstName: firstName,
        lastName: lastName,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User created", userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// LOGS IN USER WITH ENTERED USER INPUT
exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  // FINDS A USER BASED ON USERS EMAIL INPUT
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found!");
        error.statusCode = 401;
        throw error;
      }
      // IF USER IS FOUND, USER PASSWORD INPUT COMPARED TO THE DB PASSWORD
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      // THROWS ERROR IF USERINPUT PASSWORD AND DB PASSWORD DONT MATCH
      if (!isEqual) {
        const error = new Error("Wrong password!");
        error.statusCode = 401;
        throw error;
      }

      // CHECK IF USER IS ADMIN
      if (isEqual && email === "brd9326@protonmail.com") {
        const token = jwt.sign(
          {
            email: loadedUser.email,
            userId: loadedUser._id.toString(),
            isAdmin: true,
          },
          "aVerySecretiveSecret503",
          { expiresIn: "1h" }
        );
        res.status(200).json({
          token: token,
          userId: loadedUser._id.toString(),
          userName: loadedUser.firstName,
          isAdmin: true,
        });
      } else {
        //IF PASSWORD VALID, TOKEN CREATED WITH JWT
        const token = jwt.sign(
          {
            email: loadedUser.email,
            userId: loadedUser._id.toString(),
          },
          "aVerySecretiveSecret503",
          { expiresIn: "1h" }
        );

        res.status(200).json({
          token: token,
          userId: loadedUser._id.toString(),
          userName: loadedUser.firstName,
        });
      }
    })

    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
