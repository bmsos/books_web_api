const nodemailer = require('nodemailer')

module.exports = async options => {
    // Create a transporter (the service that will send the email) - MAILTRAP
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    // Define email options
    const emailOptions = {
        from: 'Cineflix Support <support@cineflix.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    await transporter.sendMail(emailOptions)
}