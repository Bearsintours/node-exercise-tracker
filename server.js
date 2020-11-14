"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const userModel = require("./models/user");

require("dotenv").config();

const app = express();

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "db connection error:"));
db.once("open", function () {
  console.log("db connected");
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// retrieve all users
app.get("/api/exercise/users", async (req, res) => {
  try {
    const users = await userModel.find({});
    res.send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

// create new user
app.post("/api/exercise/new-user", async (req, res) => {
  const user = new userModel(req.body);
  try {
    await user.save();
    console.log(user);
    res.json({ username: user.username, _id: user._id });
  } catch (e) {
    res.status(500).send(e);
  }
});

// Add exercise to user
app.post("/api/exercise/add", async (req, res) => {
  const data = req.body;
  const new_exercise = {
    description: data.description,
    duration: data.duration,
    date: data.date ? new Date(data.date) : new Date(),
  };
  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      data.userId,
      { $push: { exercise: new_exercise } },
      { new: true }
    );
    const response = {
      username: updatedUser["username"],
      description: updatedUser["exercise"][0]["description"],
      duration: updatedUser["exercise"][0]["duration"],
      _id: updatedUser["_id"],
      date: updatedUser["exercise"][0]["date"].toDateString(),
    };
    res.json(response);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
