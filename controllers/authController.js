const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModels");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");
const { sign } = require("crypto");

const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_ID
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        status: "Success",
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        role: req.body.role
    });
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //Chk if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide Email ID and Password!!', 400));
    }

    //Check if id and pw is correct
    const user = await User.findOne({ email: email }).select('+password');  //or {email}

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or Password!!', 401));
    }

    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(new AppError('The User belonging to this token no longer exist!!!'));
    }

    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return new AppError('Recently Changed the password! Please login again!', 401);
    }

    //Grant access to protected route
    req.user = freshUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //roles ['admin','lead-role']
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission to this action", 403));
        }

        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this E-mail.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user Is email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH req with new pw ${resetURL}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your token is valid only for 10min',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Email has been sent!'
        });
        next();
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError(err, 500));
    }
});
exports.resetPassword = (req, res, next) => { };