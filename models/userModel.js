const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String
    },
    role:{
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(el) {
                return el === this.password
            },
            message: 'Passwords are not same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
})


// Doesn't work on UPDATE 
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined
    next()
})

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = async function(JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt( this.passwordChangedAt.getTime() / 1000 , 10)
        console.log(JWTTimeStamp, changedTimestamp)
        return JWTTimeStamp < changedTimestamp
    }

    return false
}

userSchema.methods.logToConsole = function() {
    console.log('works')
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpires = Data.now() + 10 * 60 * 1000

    return resetToken
}



const User = mongoose.model('User', userSchema)

module.exports = User


//this.passwordChangedAt

