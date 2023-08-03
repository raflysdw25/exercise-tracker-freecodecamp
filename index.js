const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const getAllUser = require("./userExercises.js").getAllUser;
const createUser = require("./userExercises.js").createUser;
const addExercise = require("./userExercises.js").addExercise;
const findLogUser = require("./userExercises.js").findLogUser;

app
  .route("/api/users")
  .get(function (req, res) {
    getAllUser(function (error, data) {
      if (error) return res.json({ error: error });
      res.json(data);
    });
  })
  .post(function (req, res) {
    const payload = { username: req.body.username };
    createUser(payload, function (error, data) {
      res.json({ _id: data._id, username: data.username });
    });
  });

const formatDate = (validDate) => {
  if (isNaN(Date.parse(validDate))) return null;
  const fullDate = new Date(validDate);
  const getYear = fullDate.getFullYear();
  const getMonth = String(fullDate.getMonth() + 1).padStart(2, "0");
  const getDay = String(fullDate.getDate()).padStart(2, "0");

  return `${getYear}-${getMonth}-${getDay}`;
};

app.post("/api/users/:_id/exercises", function (req, res) {
  const { description, duration, date } = req.body;
  const getBodyDate =
    !date || date === "" ? formatDate(new Date()) : formatDate(date);
  if (!getBodyDate) {
    res.json({ error: "Invalid Date Format" });
    return;
  }
  const payload = {
    description,
    duration,
    date: getBodyDate,
  };
  addExercise(req.params._id, payload, function (error, data) {
    res.json(data);
  });
});

app.get("/api/users/:_id/logs", function (req, res) {
  const { from, to, limit } = req.query;
  if ((from && isNaN(Date.parse(from))) || (to && isNaN(Date.parse(to)))) {
    res.json({ error: "Invalid query date format from or to" });
    return;
  }
  const query = {
    userId: mongoose.Types.ObjectId(req.params._id),
  };

  if (limit) {
    query.limit = limit;
  }

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (fromDate && toDate) {
    query.fromDate = fromDate;
    query.toDate = toDate;
  }

  findLogUser(query, function (error, data) {
    if (error) {
      res.json({ error: error.message });
      return;
    }
    res.json(data);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
