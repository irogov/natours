const Tour = require('./../models/tourModel')
const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name, price, ratingsAverage, summary, difficulty'
    next()
}

exports.getAllTours = catchAsync( async (req, res, next) => {

    // Execute query
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
    const tours = await features.query

    res.json({
        status: "success",
        data: {
            results: tours.length, 
            tours
        }
    })
    
})

exports.getTour = catchAsync( async (req, res, next) => { //can add more parameters with /:id/:x/:y?  where /:y is an optional parameter and x and id have to be scpercified
    const tour = await Tour.findById(req.params.id)
    if(!tour) {
        return next(new AppError('No tour found', 404))
    }

    res.json({
        status: "success",
        data: {
            tour
        }
    }) 
})

exports.createTour = catchAsync(async (req, res, next) => {

    const newTour = await Tour.create(req.body)

    res.status(201).json({
        status: 'success', 
        data: {
            newTour
        }
    })
    
})

exports.updateTour = catchAsync( async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if(!tour) {
        return next(new AppError('No tour found', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })
})

exports.deleteTour = catchAsync( async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id)

    if(!tour) {
        return next(new AppError('No tour found', 404))
    }

    res.status(204).json({
        status: 'success',
        data: null
    })
})

exports.getTourStats = catchAsync( async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte : 4.5 }}
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty'},
                numTours: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price'},
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        },
        // {
        //     $match: { _id: { $ne: 'EASY'}}
        // }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })
        
    
})

exports.getMonthlyPlan = catchAsync( async (req, res, next) => {

    const year = req.params.year * 1
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' //the startDates field is an array of dates, unwind makes an object for each date in the array
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $project: {
                _id: 0 // with a zero value it is not gonna be showed
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
    
})