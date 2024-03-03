const jwt = require('jsonwebtoken')
const User = require('../Models/userModel')
const asyncErrorHandler = require('../Utils/asyncErrorHandler')
const CustomError = require('../Utils/CustomError')
const sendEmail = require('../Utils/email')
const crypto = require('crypto')

const signToken = id => {
    // AULA 106 - JSON WEB TOKENS
    // depois de criar o user na db, fazer login automaticamente
    // o login é feito assim que o user recebe um json web token
    // um jwt é constituido por uma signature, um header e um payload
    // uma signature é constituida pela secret key, header e payload
    // .sign() define a signature do jwt. 1º arg = payload. 2º arg = secret key. O header é criado automaticamente
    // no payload podemos passar o proprio user object, ou entao propriedades do user (email, id, ...). Quantas mais, mais seguro é o token
    // (optional) 3º arg: options setting
    return jwt.sign({id: id}, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    }) 
}

const signup = asyncErrorHandler(async (req, res, next) => {
   const newUser = await User.create(req.body)

   // criar token
   const token = signToken(newUser._id)
    // after creating the token we send it to the client and he will be logged in (the user's client will store the token in a cookie or in the local storage)
    
   res.status(201).json({
    status: 'success',
    token,
    data: {
        user: newUser
    }
   })
})

const login = asyncErrorHandler(async (req, res, next) => {
    const {email, password} = req.body

    if(!email || !password) {
        const error = new CustomError('Please provide an email and password.', 400)
        return next(error)
    }

    // select('+password') brings the password property of user to the query (although it was defined as {select: false} in the schema)
    const user = await User.findOne({email}).select('+password')

    if (!user) {
        const error = new CustomError('No user was found with that email.', 404)
        return next(error)
    }
    console.log(user.password)
    // instance method comparePasswordInDb() criado em userModel.js (ver explicação lá) - permite ser usado todos os docs criados a partir de um certo modelo
    const passwordMatch = await user.comparePasswordInDb(password, user.password)

    if(!passwordMatch) {
        const error = new CustomError('Password does not match.', 400)
        return next(error)
    }

    const token = signToken(user._id)

    res.status(200).json({
        status: 'success',
        token
    })
})


// AULA 108 - PROTECTING ROUTES
// proteger routes para que apenas users logados possam aceder a elas
// para tal criamos um middleware que entra valida o login antes da execução de cada função protegida
const validateLogin = asyncErrorHandler(async (req, res, next) => {
    // 1. Read the token & check if exists. (usually we pass the token through the req header as a custom key-value pair: {authorization: `bearer ${token}`})
    // adding 'Bearer ' to the value of authorization key is a convention
    let token = req.headers.authorization
    if (token && token.startsWith('Bearer')) {
        token = token.replace('Bearer ', '')
    }

    if(!token) {
        next(new CustomError('You are not logged in.', 401))
    }

    // 2. validate the token
    // (THIS COMMENT IS NOT WORKING SINCE jwt.verify() is returning a promise) .verify() is an async method but does not return a promise, so we need to promisify it (need to import the built-in util library)
    const decodedToken = jwt.verify(token, process.env.SECRET_STR)

    // 3. check if the user exists (ex: user might get deleted from db right after login)
    const user = await User.findById(decodedToken.id)

    if(!user) {
        next(new CustomError('The user with this token does not exist in the databse.'))
    }

    // 4. check if user changed password after the token was issued (need to create an instance method)
    if (user.hasPasswordChanged(decodedToken.iat)) {
        next(new CustomError('The password has changed since last login. Please login again.', 401))
    }
    
    // 5. allow user to access route
    req.user = user
    next()
})

// AULA 111 - checking admin permission
// since a middleware function can only receive req, res and next as args
// we create a wrapper function to receive the user role arg 
// in case we have multiple roles:
// ... role is a rest parameter (like *args in python) - we can pass multiple values and they will be stored in a list 
const checkUserPermission = (...roleList) => {
    return (req, res, next) => {
        // since this middleware is used after the validateLogin and this last one has set req.user = user, we can use it to get the user role
        if(roleList.includes(req.user.role)) {
            next(new CustomError('You do not have permission to perform this action', 403))
        }
        next()
    }
}

// AULA 112 e 113 - PASSWORD RESET FUNCIONALITY
// for that we create 2 middlewares: forgotPassword and passwordReset
const forgotPassword = asyncErrorHandler(async (req, res, next) => {
    // 1. Get user from posted email 
    const user = await User.findOne({email: req.body.email})

    if (!user) {
        next(new CustomError('We could not fin a user with that email.', 404))
    }

    // 2. Generate random reset token
    // for that we create an instance method
    const resetToken = user.createResetPasswordToken()
    await user.save({validateBeforeSave: false})    // we dont want mongoose to validate the data in this case
    
    // 3. Send the token back to the user email (need the nodemailer package)
    // created a sendEmail function in email.js
    // need to set the options to send as arg for sendEmail() function
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}` //req.get('host') will return the localhost and the :port
    const message = `We have received a password reset request. Please use the link below to reset your password\n\n${resetUrl}.\n\nThis link will be valid for 10 minutes.`
    
    // if we get an error when trying to send the email, we want to reset the passwordResetToken properties to undefined
    try {
        await sendEmail({
            email: user.email,
            subject: 'Password change request received',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'Password reset link sent to the user email.'
        })
    } catch (error) {
        user.passwordResetToken = undefined
        user.passwordResetTokenExpireDate = undefined
        user.save({validateBeforeSave: false})

        return next(new CustomError('There was an error sending the password reset email. Please try again later.', 500))
    }
})

// AULA 114 - RESETING THE PASSWORD
const resetPassword = asyncErrorHandler(async (req, res, next) => {
    // find user using resetToken and check if token has not expired
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex')
    const user = await User.findOne({passwordResetToken: token, passwordResetTokenExpireDate: {$gt: Date.now()}})

    if (!user) {
        next(new CustomError('Token is invalid or has expired.', 400))
    }

    // if user exists with the given token and it has not expired, set the new password
    user.password = req.body.password
    user.confirmPassword = req.body.confirmPassword
    // also set token and its expireDate to undefined
    user.passwordResetToken = undefined
    user.passwordResetTokenExpireDate = undefined
    // also we want to set the passwordChangedAt property to the current datetime
    user.passwordChangedAt = Date.now()
    // finally save the data to the db
    user.save()

    // once the password is reset, login the user automatically
    const loginToken = signToken(user._id)

    res.status(200).json({
        status: 'success',
        token: loginToken
    })
})

module.exports = {
    signup, 
    login, 
    validateLogin, 
    checkUserPermission, 
    forgotPassword,
    resetPassword
}