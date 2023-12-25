require("dotenv").config();
const express = require('express');

const User = require('./models/user');

const app = express();
app.use(express.json()); //express cannot handle JSON directly, it needs a middleware

app.get("/", (req, res)=>{
    res.send("<h3> Hello from auth system - LCO </h3>");
});

app.post("/register", async(req, res)=>{
    const {firstname, lastname, email, password} = req.body;

    if (!(email && firstname && lastname && password)){
        res.status(400).send('All fields are required');
    }

    //await-> will return a PROMISE = (success/failure) OR use a try-catch block
    const existingUser = await User.findOne({email: email});    //now its asynchronous operation instead of synchronous

    if (existingUser)
        res.status(401).send('User already exists');

});

// instead of using the LISTEN code here, we will export it to index.js coz this will get bigger with middlewares, routes
// so listening operation is kept in a seperate file
module.exports = app;