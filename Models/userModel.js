const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'This field is required.']
    },
    email: {
        type: String,
        required: [true, 'This field is required.'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Not a valid email.']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'This field is required.'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'This field is required.'],
        validate: {
            // this type of custom validators only work on .save() and .create() methods (i.e. dont work on findByIdAndUpdate)
            validator: function(value) {
                return value === this.password
            },
            message: 'Passwords do not match.'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpireDate: Date
})

userSchema.pre('save', async function(next) {
    // if the password was not modified do nothing
    if(!this.isModified('password')) {
        return next()
    }
    // otherwise we want to encrypt it using the library bcryptjs
    // encrypt is also called hashing
    // 1º arg: value. 2º arg: numSaltRounds (1 to usually 12) - the bigger the more secure but also slower
    this.password = await bcrypt.hash(this.password, 12)
    
    // after that we want to set confirmPassword to undefined since wew dont want to save it in the db
    this.confirmPassword = undefined

    next()
})

// AULA 107 min 15 - INSTANCE METHODS
// instance methods will be available on all documents of a collection (created from a certain model)
// for that we need to specify the .methods property and then create the instance method, just like below
userSchema.methods.comparePasswordInDb = async function (pass, passDB) {
    return await bcrypt.compare(pass, passDB)
}

userSchema.methods.hasPasswordChanged = function (tokenTimestamp) {
    console.log(this)
    console.log(this.passwordChangedAt)
    // we need to have the timestamp when the token was issued to the user (token has a iat - "issued at" - property)
    // we also need a timestamp for when the password was created (creating a passwordChangedAt property in userSchema)
    // that property will only show up in the doc if it has a value and it will only have a value it the user changes the pass 
    if(this.passwordChangedAt) {
        const passwordChangedAtToTimestamp = this.passwordChangedAt.getTime() / 1000 // .getTime() converte formato Date em timestamp milisseconds. Dividir por 1000 (/1000) converte em seconds
        return tokenTimestamp < passwordChangedAtToTimestamp 
    }
    return false
}

userSchema.methods.createResetPasswordToken = function () {
    // criar um random string token
    // randomBytes(nr_caracteres).toString(encryptionFormat)
    const resetToken = crypto.randomBytes(32).toString('hex') // hexadecimal
    // encriptar o token (para ser guardado na db)
    // createHash(algoritmo). update(token). digest(encryptionFormat)
    // then we store the token in the db (need to update the userSchema)
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    // by convention this token expire in 10 minutes
    // to Date.now add 10 (minutes). Then we convert those 10 min into milisseconds (10 * 60 * 1000), so that we can add them to Date.now() which is in milisseconds
    this.passwordResetTokenExpireDate = Date.now() + (10 * 60 * 1000)

    // as of now we just set the two properties but didn't save them in the db, for that we need to call user.save() in the authController

    // finally we send the plain string token to the user
    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User