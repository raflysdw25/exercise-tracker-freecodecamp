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

const createUser = require("./userExercises.js").createUser;
const addExercise = require("./userExercises.js").addExercise;
const findLogUser = require("./userExercises.js").findLogUser;

app.post("/api/users", function (req, res) {
  const payload = { username: req.body.username };
  createUser(payload, function (error, data) {
    res.json({ _id: data._id, username: data.username });
  });
});
app.post("/api/users/:_id/exercises", function (req, res) {
  const payload = {
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date,
  };
  addExercise(req.params._id, payload, function (error, data) {
    res.json({
      username: data.username,
      description: req.body.description,
      duration: req.body.duration,
      date: new Date(req.body.date).toDateString(),
      _id: data._id,
    });
  });
});

app.get("/api/users/:_id/logs", function (req, res) {
  const { from, to, limit } = req.query;
  if ((from && isNaN(Date.parse(from))) || (to && isNaN(Date.parse(to)))) {
    res.json({ error: "Invalid query date format from or to" });
    return;
  }
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const query = {
    _id: mongoose.Types.ObjectId(req.params._id),
  };

  const projections = {
    username: 1, // Include username field
    log: 1,
  };

  if (fromDate && toDate) {
    query["log.date"] = { $gte: fromDate, $lte: toDate };
    projections["log"] = {
      $cond: {
        if: {
          $ifNull: ["$log", false],
        },
        then: {
          $filter: {
            input: "$log",
            as: "logItem",
            cond: {
              $and: [
                { $ifNull: ["$$logItem.date", true] },
                { $gte: ["$$logItem.date", fromDate] },
                { $lte: ["$$logItem.date", toDate] },
              ],
            },
          },
        },
        else: "$log",
      },
    };
  }

  findLogUser(query, projections, function (error, data) {
    if (error) {
      res.json({ error: error.message });
      return;
    }
    res.json({
      _id: data._id,
      username: data.username,
      count: data.log.length,
      logs: limit ? data.log.slice(0, limit) : data.log,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
