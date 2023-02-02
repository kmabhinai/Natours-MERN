const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require("./utils/appError");
const globalErrorhandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global MiddleWare
//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Security middleware
app.use(helmet());

//Dev logging
if (process.env.NODE_ENV === 'devlopment') {
    app.use(morgan('dev'));
}

//Limiting the req
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many Requests from this IP, please try again later'
});
app.use('/api', limiter);

//Body parser
app.use(express.json({ limit: '10kb' })); // Middle wear modifies the req and res objects

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'difficulty', 'price']
}));

/*
    *for getting the id num or some particular data keep : and declare a var '/:a'
    *if you want to make the var optional then add question mark at the end '/:a?'
*/
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

app.get('/', (req, res) => {
    res.status(200).render('base');
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    // res.status(400).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on this Server!`
    // });

    // const err = new Error(`Can't find ${req.originalUrl} on this Server!`);
    // err.status = 'fail';
    // err.statusCode = 404;
    // next(err);
    next(new AppError(`Can't find ${req.originalUrl} on this Server!`, 404));
});

app.use(globalErrorhandler);

module.exports = app;