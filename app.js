require("dotenv").config();
require("./config/database").connect();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('./models/user');
const auth = require("./middleware/auth");

const app = express();
//middlewares as app cannot directly read 1. JSON, 2. cookies from req.cookies
app.use(express.json()); //express cannot handle JSON directly, it needs a middleware
app.use(cookieParser());

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
        email: email.toLowerCase(),
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
    user.password = undefined;

    //send the token or send just success yes and redirect - choice
    res.status(201).json(user);
    } catch (error) {
        console.log(error);
    }
});

app.post("/login", async (req,res)=>{
    console.log('In login route');
    try {
        const {email, password} = req.body;
        
        if (!(email && password))
            res.status(400).send("Field is missing");

        const user = await User.findOne({email});

        // if(!(user))
        //     res.status(400).send("You are not registered in our app.");

        // await bcrypt.compare(password, user.password);

        if (user && (await bcrypt.compare(password, user.password))){
            const token = jwt.sign(
                {user_id: user._id, email},
                process.env.SECRET_KEY,
                {
                    expiresIn: "2h"
                }
            );
            user.token = token;
            user.password = undefined;
            // res.status(200).json(user);  //setting up the cookie instead of sending the response

            //if you want to use cookies
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), //will expire in 3 days
                httpOnly: true, //this allows the cookie to be ONLY read by backend server
            }

            res.status(200).cookie('token', token, options).json({
                success: true,
                token,
                user
            });
        }

        res.status(400).send("email or password is incorrectww")

    } catch (error) {
        console.log(error);
    }
});

//custom middleware is used to protect the route
app.get("/dashboard", auth, async(req, res)=>{
    res.send("Welcome to secret information")
});
// instead of using the LISTEN code here, we will export it to index.js coz this will get bigger with middlewares, routes
// so listening operation is kept in a seperate file
module.exports = app;