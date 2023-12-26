require("dotenv").config();
require("./config/database").connect();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/user');

const app = express();
app.use(express.json()); //express cannot handle JSON directly, it needs a middleware

app.get("/", (req, res)=>{
    res.send("<h3> Hello from auth system - LCO </h3>");
});

app.post("/register", async(req, res)=>{
    try {
    const {firstname, lastname, email, password} = req.body;

    if (!(email && firstname && lastname && password)){
        res.status(400).send('All fields are required');
    }

    //await-> will return a PROMISE = (success/failure) OR use a try-catch block
    const existingUser = await User.findOne({email: email});    //now its asynchronous operation instead of synchronous

    if (existingUser)
        res.status(401).send('User already exists');

    //encryption
    const myEncPassword = await bcrypt.hash(password, 10);

    // after creating a User, mongoDB/mongoose will assign a unique obj id which we can access with the variable "user"
    const user = await User.create({
        firstname,
        lastname,
        email: email.toLowercase(),
        password: myEncPassword
    });

    //token
    const token = jwt.sign(
        {user_id: user._id, email},
        process.env.SECRET_KEY,
        {
            expiresIn:"2h"
        }
    );
    user.token = token;

    //update or not in DB

    //TODO: handle password situation
    res.status(201).json(user);
    } catch (error) {
        console.log(error);
    }
});

// instead of using the LISTEN code here, we will export it to index.js coz this will get bigger with middlewares, routes
// so listening operation is kept in a seperate file
module.exports = app;