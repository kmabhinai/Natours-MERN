const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();


router
    .route("/signup")
    .post(authController.signup);

router
    .route("/login")
    .post(authController.login);

router
    .route("/forgotPassword")
    .post(authController.forgotPassword);

router
    .route("/resetPassword/:token")
    .patch(authController.resetPassword);

//Protect all users after this
router.use(authController.protect);

router
    .route("/me")
    .get(userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));

router
    .route("/")
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route("/:id")
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);


module.exports = router;