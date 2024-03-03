const ac = require('../Controllers/authController')
const express = require('express')
const router = express.Router()

router.route('/signup').post(ac.signup)
router.route('/login').post(ac.login)
router.route('/forgotPassword').post(ac.forgotPassword)
router.route('/resetPassword/:token').patch(ac.resetPassword)

module.exports = router