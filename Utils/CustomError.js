// AULA 92
class CustomError extends Error {
    constructor (message, statusCode) {
        super(message)
        this.statusCode = statusCode
        // statusCodes between 400 and 499 are operational (client) errors. From 500 to 599 its a programming (server) errors 
        this.status = statusCode >= 400 && statusCode < 500 ? 'Failed' : 'Error'    // ternary expression

        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = CustomError