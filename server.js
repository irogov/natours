const dotenv = require('dotenv')
const mongoose = require('mongoose')

process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    process.exit(1)
})
dotenv.config({path: './config.env'})
const app = require('./app')

mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(con => {
    console.log('DB connecetion is successful')
})


const port = process.env.PORT || 3000
const server = app.listen(port, () => {
    console.log('Listens on 3000')
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    server.close(() => {
        process.exit(1)
    })
})

