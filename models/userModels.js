const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        required: [true, "Email is Required"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a Valid Email"]
    },
    photo: String,
    role: {
        type: String,
        enum: {
            values: ['admin', 'guide', 'lead-guide', 'user'],
            message: 'Role should be admin,guide,lead-guide,user!!'
        },
        default: 'user'
    },
    password: {
        type: String,
        required: [true, "Password is Mandatory"],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, "Confirm Password is Mandatory"],
        validate: {
            //This only works on Create and Save!!!
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords are not the same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function (next) {
    //This fn will run if pw is modified
    if (!this.isModified('password')) return next();

    //Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    //Delete the confirm Pw field
    this.confirmPassword = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimeStamp < changedTimestamp;
    }
    return false;//Not Changed
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + (10 * 60 * 1000);
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;