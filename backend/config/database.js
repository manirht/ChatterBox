const mongoose = require('mongoose')

const databaseConnect = () => {
    mongoose.connect('mongodb+srv://vamsi:vamsi123@cluster0.mm5btjt.mongodb.net/?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log('Mongodb Database Connected')
    }).catch(error => {
        console.log(error)
    })
}

module.exports = databaseConnect;