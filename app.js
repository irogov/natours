const express = require('express')
const morgan = require('morgan')
const tourRouter = require('./routes/tourRouters')
const userRouter = require('./routes/userRouters')
const appError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const app = express()

//MIDDLEWARE
// if (process.env.NODE_ENV === 'development') {
//     app.use(morgan('dev'))
// }

app.use(express.json())
app.use(express.static(`${__dirname}/public`))

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'Fail',
    //     message: `Can't find ${req.originalUrl}`
    // })
    
    next(new appError(`Can't find ${req.originalUrl}`, 404))
})

app.use(globalErrorHandler)

module.exports = app