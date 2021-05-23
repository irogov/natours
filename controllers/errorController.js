const AppError = require('./../utils/appError')

const handleTokenExpiredError = () => new AppError('Your token has exprired. Please log in', 401)
const handleJWTError = () => new AppError('Invalid token. Please log in', 401)

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const hadleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    const message = `Duplicate field value: ${value}. Please use another one`
    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Objecet.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message, 400)
}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
    })
}

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        })
    }
    
}


module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = {...err}
        if (error.name === 'CastError') {
            error = handleCastErrorDB(error)
        }
        if (error.code === 11000) {
            error = hadleDuplicateFieldsDB(error)
        }
        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error)
        }
        if (error.namee === 'JsonWebTokenError') error = handleJWTError()
        if (error.name === 'TokenExpired') error = handleTokenExpiredError()

        sendErrorProd(error, res)
    }

    
}