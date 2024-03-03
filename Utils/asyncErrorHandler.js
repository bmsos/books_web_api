// the goal of this function is to catch the error that might happen in the async route handlers
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(err => next(err))
    }
}