// this script is completely independent of the node app
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const fs = require('fs')
const Movie = require('../Models/movieModel')

// it will run from the command prompt, so the paths shall start from the root folder
dotenv.config({path: './config.env'})

mongoose.connect(process.env.CONN_STR, {useNewUrlParser: true})
.then(conn => console.log('Connection successful'))
.catch(error => console.log('Some error has occured.'))

const movies = JSON.parse(fs.readFileSync('./data/movies.json', 'utf-8'))

// delete all objects from the collections
const deleteMovies = async () => {
    try{
        await Movie.deleteMany()
        console.log('Data deleted')
    } catch (error) {
        console.log(error.message)
    }
    process.exit()      // sair do processo (no cmd) assim que a função terminar a execução
}

// import from json file and add documents to collection
const importMovies = async () => {
    try{
        await Movie.create(movies)
        console.log('Data imported to collection')
    } catch (error) {
        console.log(error.message)
    }
    process.exit()
}

if (process.argv[2] == '--import'){     // node ./data/importDevData --import
    importMovies()
}
if (process.argv[2] == '--delete'){     // node ./data/importDevData --delete
    deleteMovies()
}