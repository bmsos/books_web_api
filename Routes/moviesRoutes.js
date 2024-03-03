const mc = require('../Controllers/moviesController')
const ac = require('../Controllers/authController')

const express = require('express')
const router = express.Router()

// Aula 80 - ALIASING ROUTES
router.route('/highest-rated').get(mc.getHighestRated, mc.getMovies)

// AULA 82
router.route('/movie-stats').get(mc.getMovieStats)

//AULA 83
router.route('/movies-by-genre/:genre').get(mc.getMovieByGenre)

router.route('/')
    .get(ac.validateLogin, mc.getMovies)
    .post(ac.validateLogin, mc.addMovie)

router.route('/:id')
    .get(ac.validateLogin, mc.getMovie)
    .patch(ac.validateLogin, mc.updateMovie)
    .delete(ac.validateLogin, ac.checkUserPermission('admin'), mc.deleteMovie) //since checkUserPermission is a wrapper func, we can call it bc it will return the middleware

module.exports = router