const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have no more than 40 characteres'],
        minlength: [10, 'A tour name must have no less than 10 characteres'],
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug:{
        type: String
    },
    duration: {
        type: Number,
        required: [true, 'The tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'The tour must have a maximum group size']
    },
    difficulty: {
        type: String,
        required: [true, 'The tour must have a difficulty'],
        enum: {
           values: ['easy', 'medium', 'difficult'],
           message: 'Difficulty is either: easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'The rating must be more or equal to one'],
        max: [5, 'The rating must be less or equal to five']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            // this is gonna work only for newly created document not for updated
            validator: function(val) {
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be lower than regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'The tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'The tour must have a cover image']
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
    }
},{
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

//Document middleware
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7
})

// tourSchema.pre('save', function(next) { // runs before save() and create() not before update()
//     this.slug = this.slugify(this.name, {lower: true})
//     next()
// })

// tourSchema.pre('save', function(next) { // runs before save() and create()
    
// })

// tourSchema.post('save', function(doc, next) {

// })

//Query middleware
tourSchema.pre(/^find/, function(next) {  //with thee reqular expression will be executed for all queries that start with find (find, findOne...)
    this.find({secretTour: {$ne: true}})

    next()
})

tourSchema.post(/^find/, function(docs, next) {

    next()
})

//Aggreagation middleware
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({$match: { secretTour: { $ne: true }}})
    next()
})


const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour