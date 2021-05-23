const User = require('./../models/userModel')
const {promisify} = require('util')
const catchAsync = require('./../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')

const signToken = id => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
    return token
}

exports.signup = catchAsync( async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        photo: req.body.photo,
        role: req.body.role
    })
    const token = signToken(newUser._id)
    
    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    })
})

exports.login = catchAsync( async (req, res, next) => {
    const {email, password} = req.body
    if (!email || !password) {
        next(new AppError('Please provide email and password'), 400)
    }

    const user = await User.findOne({ email }).select('+password')

    if(!user || !(await user.correctPassword(password, user.password))) {
        next(new AppError('Incorret email or password'), 401)
    } 

    const token = signToken(user._id)
    res.status(201).json({
        status: 'success',
        token
    })
})

exports.protect = catchAsync( async (req, res, next) => {
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    if (!token) {
        return next(new AppError('You are not logged in', 401))
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user that belongs to this token does no longer exist', 401))
    }

    if (await currentUser.changedPasswordAfter(decoded.iat)) {
        console.log(currentUser.changedPasswordAfter(decoded.iat))
        return next(new AppError('User changed password! Please login again', 401))
    }

    req.user = currentUser
    next()
})

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have enough rights to perform this action', 403))
        } 
        next()
    }
}

exports.forgotPassword = catchAsync( async (req, res, next) => {
    // 1) Get user by email
    const user = await User.find({email: req.body.email})
    if(!user) {
        return next(new AppError('Theres no user with this email', 404))
    }


    // 2) Generate random reset token

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false })

    // 3) Send it back as an email


})

exports.resetPassword = (req, res, next) => {}