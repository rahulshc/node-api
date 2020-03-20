const path = require('path');
const express = require('express');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const uuidv4 = require('uuid/v4');
const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },

    filename: function(req, file, cb) {
        cb(null, uuidv4() + '-' + file.originalname)
    }
    
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype=== 'image/png' || file.mimetype=== 'image/jpg' || file.mimetype=== 'image/jpeg')
    {
        cb(null, true);
    }
    else{
        cb(null, false);
    }
}
//urlencoded is form data
app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
//will be set on on all response
//* allows all websites otherwise we can write explicitly 'codepen.io' for mutiple seperate with comma
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');//which origins to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');//which methods to allow
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
//error handling middleware for all errors
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data});
});
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(result=> {
    const server = app.listen(8080);
    const io= require('./socket').init(server);
    io.on('connection', socket => {//runs for every new client
        console.log('client connected');
    });
})
.catch(err=>console.log(err));
