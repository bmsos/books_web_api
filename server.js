const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({path: './config.env'})

const app = require('./app')

mongoose.connect(process.env.CONN_STR, {useNewUrlParser: true})
.then(conn => console.log('Connection successful'))
.catch(error => console.log('Some error has occured.'))

let port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Server has started')
})