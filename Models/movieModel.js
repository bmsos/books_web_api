const fs = require('fs')
// AULA 89 - THIRD PARTY VALIDATORS (npm install validator)
const validator = require('validator')
const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: [true, 'Name is required.'], 
        unique: true,
        maxlength: [100, 'Movie name must not have more than 100 characters'],
        minlength: [4, 'Movie name must not have less than 4 characters'],
        trim: true,
        // using validator librabry validators
        // validate: [validator.isAlpha, 'Name should only contain alphabetic characters']
    },
    description: {
        type: String, 
        required: [true, 'Description is required'], 
        trim: true
    },
    duration: {
        type: Number, 
        required: [true, 'Duration is required']
    },
    ratings: {
        type: Number,
        /*// min and max as built-in validators
        min: [1, 'Rating must be 1.0 or bigger'],
        max: [10, 'Rating must be 10 or lower']*/
        
        // AULA 89 - CUSTOM VALIDATORS
        // custom validators are functions who validate a value if they return true
        // min and max as custom validators
        validate: {
            validator: function(value) {
                return value >= 1 && value <= 10
            },
            message: 'The value {VALUE} is not valid. Rating must be between 1 and 10'
        }
    },
    totalRating: Number,
    releaseYear: {
        type: Number,
        required: [true, 'Release year is required']
    },
    releaseDate: Date,
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    genres: {
        type: [String],
        required: true,
        /* enum: {           // enum especifica uma lista de opções obrigatorias 
            value: ['Action', 'Adventure', 'Sci-Fi', 'Thriller', 'Crime', 'Drama', 'Romance', 'Biography'],
            message: 'This genre does not exist.'
        } */
    },
    directors: {
        type: [String],
        required: true
    },
    coverImage: {
        type: String,
        required: [true, 'Cover image is required']
    },
    actors: {
        type: [String],
        required: [true, 'Actors field is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    createdBy: String
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})

// AULA 84 - virtual properties
movieSchema.virtual('durationHours').get(function (){
    return this.duration / 60
})

// AULA 85 - DOCUMENT MIDDLEWARES
movieSchema.pre('save', function(next){
    this.createdBy = 'Bruno'
    next()
})

movieSchema.post('save', function(doc, next){
    const content = `A new movie document with name ${doc.name} has been created by ${doc.createdBy}\n`
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, err => {
        console.log(err.message)
    })
    next()
})

// AULA 86 - QUERY MIDDLEWARE
movieSchema.pre(/^find/, function(next){    
    this.find({releaseDate: {$lte: Date.now()}})
    this.startTime = Date.now()
    next()
})

movieSchema.post(/^find/, function(query, next){    
    this.finishTime = Date.now() 
    const content = `The query took ${this.finishTime - this.startTime} milisseconds to fetch the data.`
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, err => {
        console.log(err.message)
    }) 

    next()
})

// AULA 86 - AGGREGATION MIDDLEWARE
movieSchema.pre('aggregate', function(next){  
    const filter = {$match: {releaseDate: {$lte: new Date()}}}
    this.pipeline().unshift(filter)

    next()
})

module.exports = mongoose.model('movie', movieSchema)