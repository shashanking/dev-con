//mongodb connection done here

const mongoose = require('mongoose');
const config = require('config');

const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        mongoose.connect(db, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true, 
            useCreateIndex : true,
            useFindAndModify : false
        });
        console.log('mongoDB connected');
    } catch (error) {
        console.error(error.message);
        // Exit with 1
        process.exit(1);
    }
}

module.exports = connectDB;