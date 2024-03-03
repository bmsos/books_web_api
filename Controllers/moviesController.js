const Movie = require('../Models/movieModel')
const ApiFeatures = require('../Utils/ApiFeatures')
const CustomError = require('../Utils/CustomError')
const asyncErrorHandler = require('../Utils/asyncErrorHandler')

const getHighestRated = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratings'
    next()
}

const getMovies = asyncErrorHandler(async (req, res, next) => {
    
    const features = new ApiFeatures(Movie.find(), req.query).filter().sort().fields().paginate()

    let movies = await features.query

    res.status(200).json({
        status: 'Success',
        length: movies.length,
        data: {
            movies
        }
    })
})

const getMovie = asyncErrorHandler(async (req, res, next) => {
    const movie = await Movie.findById(req.params.id)

    if (!movie) {
        const error = new CustomError(`Movie with id ${req.params.id} not found.`, 404)
        return next(error)
    }

    res.status(200).json({
        status: 'Success',
        data: {
            movie
        }
    })
})

const addMovie = asyncErrorHandler(async (req, res, next) => {
        const movie = await Movie.create(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                movie   // = movie: movie
            }
        })
})

const updateMovie = asyncErrorHandler(async (req, res, next) => {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

    if (!movie) {
        const error = new CustomError(`Movie with id ${req.params.id} not found.`, 404)
        return next(error)
    }

    res.status(200).json({
        status: 'Success',
        data: {
            movie   // = movie: movie
        }
    })  
})

const deleteMovie = asyncErrorHandler(async (req, res, next) => {      
    const movie = await Movie.findByIdAndDelete(req.params.id)

    if (!movie) {
        const error = new CustomError(`Movie with id ${req.params.id} not found.`, 404)
        return next(error)
    }
    
    res.status(204).json({
        status: 'Success',
        data: null
    })
})

// AULA 82 - AGGREGATION
const getMovieStats = asyncErrorHandler(async (req, res, next) => {
    const stats = await Movie.aggregate([
        {$match: {ratings: {$gte: 4.5}}}, 
        {$group: {
            _id: '$releaseYear',
            avgRating: {$avg: '$ratings'},
            avgPrice: {$avg: '$price'},
            minPrice: {$min: '$price'},
            maxPrice: {$max: '$price'},
            priceTotal: {$sum: '$price'},
            movieCount: {$sum: 1}
            }
        },
        {$sort: {minPrice:1}},
        {$match: {maxPrice: {$gte: 0}}}, 
    ])

    res.status(200).json({
        status: 'Success',
        count: stats.length,
        data: {
            stats
        }
    })
})

const getMovieByGenre = asyncErrorHandler(async (req, res, next) => {
    const genre = req.params.genre
    const movies = await Movie.aggregate([
        {$unwind: '$genres'},
        {$group: {
            _id: '$genres',
            movieCount: {$sum: 1},
            movies: {$push: '$name'}
        }},
        {$addFields: {genre: '$_id'}},
        {$project: {_id:0}},
        {$sort: {movieCount:-1}},
        {$limit: 6},
        {$match: {genre: genre}}
    ])
    res.status(200).json({
        status: 'Success',
        count: movies.length,
        data: {
            movies
        }
    })
})

module.exports = {
    getMovie, 
    getMovies, 
    addMovie, 
    updateMovie, 
    deleteMovie, 
    getHighestRated, 
    getMovieStats,
    getMovieByGenre
}