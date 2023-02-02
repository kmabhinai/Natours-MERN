const express = require('express');
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");
// const reviewController = require('./tourController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkId);

router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guides', 'guides'),
        tourController.getMonthlyPlan
    );

router
    .route('/')
    .get(tourController.getAllTours)
    .post(authController.protect,
        authController.restrictTo('admin', 'lead-guides'),
        tourController.createTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guides'),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guides'),
        tourController.deleteTour
    );

// router
//     .route('/:tourId/review')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview
//     );

module.exports = router;