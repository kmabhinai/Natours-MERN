const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModels");
// const validator = require("validator");

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A Tour must have less than 40 char'],
        minlength: [10, 'A Tour must have more than 10 char'],
        // validate: validator.isAlpha
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A Tour must have a duration']
    },
    maxGroupSize: Number,
    difficulty: {
        type: String,
        required: [true, 'A Tour must have a difficulity'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either : easy,medium,difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Must be >1'],
        max: [5, 'Must be <5']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    priceDiscount: Number,
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have the summary']
    },
    price: {
        type: Number,
        required: [true, 'A tour must have price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //this only points to current NEW document creation 
                return val < this.price;
            },
            message: 'Discount ({VALUE}) should be < Regular Price'
        }
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// DOCUMENT MIDDLEWARE : runs before .save() and .create()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

//Embedding the data
// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.post('save',function(doc,next){
//     console.log(doc);
//     next();
// });

//QUERY MIDDLEWARE 
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -_id' //Remove the un wanted data
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    // console.log(docs);
    next();
});

//AGGREGATION MIDDLEWARE 
tourSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;