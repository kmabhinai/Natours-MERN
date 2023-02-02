const User = require("./../models/userModels");
const catchAsync = require("./../utils/catchAsync");
const factory = require('./handlerFactory');

exports.getAllUsers = factory.getAll(User);

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "error",
        msg: "This Route is not defined! please use /signup instead"
    });
};

exports.getUser = factory.getOne(User);

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

//do not update the pw
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);