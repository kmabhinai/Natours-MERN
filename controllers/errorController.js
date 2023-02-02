const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const message = `Duplicate feild value : ${err.keyValue.name}. Please give unique name`;
    return new AppError(message, 400);
};

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid Input data ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () => new AppError('Your Token is Expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    //Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // console.error(err);

        res.status(500).json({
            status: 'Error',
            message: 'Something went wrong',
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV == "production") {
        let error = { ...err };

        if (err.name === "CastError") {
            error = handleCastErrorDB(error);
        }
        if (err.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        }
        if (err.name === "ValidationError") {
            error = handleValidationError(error);
        }
        if (err.name === "JsonWebTokenError") {
            error = handleJWTError();
        }
        if (err.name === "TokenExpiredError") {
            error = handleJWTExpiredError();
        }
        sendErrorProd(error, res);
    }

}; 