const express = require('express');
const feedRoutes = require('./routes/feed');
const bodyParser = require('body-parser');

const app = express();

//urlencoded is form data
app.use(bodyParser.json());
//will be set on on all response
//* allows all websites otherwise we can write explicitly 'codepen.io' for mutiple seperate with comma
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');//which origins to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');//which methods to allow
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

app.listen(8080);