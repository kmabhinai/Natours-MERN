const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require('fs');
const Tour = require('./../../models/tourModels');
const User = require('./../../models/userModels');
const Review = require('./../../models/reviewModel');
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(con => console.log("Db connected"));

//Insert data to db
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data Loaded');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

//delete all data in db
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Deleted');
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// console.log(process.argv);

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}