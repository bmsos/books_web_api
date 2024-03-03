const CustomError = require('./Utils/CustomError')
const errorsController = require('./Controllers/errorsController') 
const express = require('express')
let app = express()

const moviesRouter = require('./Routes/moviesRoutes')
const userRouter = require('./Routes/authRoutes')

app.use(express.json())

app.use('/api/v1/movies', moviesRouter)
app.use('/api/v1/users', userRouter)

// AULA 90 - DEFAULT ROUTE
// definir uma route padrao para quando o client requer uma route que nao foi definida na app
// .all() especifica qualquer tipo de route (get, post, put, patch, delete, ...)
// '*' aceita QUALQUER ROUTE, logo é crucial especificarmos a default route em último lugar, caso contrário todas os urls levariam a esta route
app.all('*', (req, res, next) => {

// AULA 91
/*     const err = new Error(`Can't find ${req.originalUrl} on the server`)     // this error will be sent to the error handling middleware so we need to define .statusCode, .status and .message
    err.status = 'Failed'
    err.statusCode = 404 */

    const err = new CustomError(`Can't find ${req.originalUrl} on the server`, 404)

    // para passar o erro para o error handling middleware:
    // when we pass ANY arg for the next() function, express will automatically know that there was an error
    // so express will skip every other middleware in the stack and go directly to the error handling middleware
    next(err)
})

// AULA 91
// to make a function work as a global error handling middleware, we must pass error as the 1st arg and then the 3 normal middleware args
app.use(errorsController)

module.exports = app