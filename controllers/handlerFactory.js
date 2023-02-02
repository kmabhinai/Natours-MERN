const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);

    if (!doc) {
        return next(new AppError("No Document Found with the given id", 404));
    }
    res.status(204).json({
        status: 'success'
    });
});

exports.updateOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError("No document Found with the given id", 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    // const newTour =  new Tour({});
    //newTour.save();

    const newDocument = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            data: newDocument
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;
    // Tour.findOne({ id: req.params.id });

    if (!doc) {
        return next(new AppError("No Document Found with the given id", 404));
    }

    res.status(200).json({
        status: 'Success',
        data: {
            data: doc
        }
    });
});

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    //For reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();
    const doc = await features.query;
    // const doc = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy')

    res.status(200).json({
        status: 'Success',
        count: doc.length,
        data: {
            data: doc
        }
    });
});
