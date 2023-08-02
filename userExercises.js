require("dotenv").config();
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

let exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: new Date(),
  },
});

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    requried: true,
  },
  log: [exerciseSchema],
});

let User = mongoose.model("User", userSchema);

const createUser = (payload, done) => {
  const addUser = new User({ username: payload.username });
  addUser.save(function (error, data) {
    if (error) return console.error(error);
    done(null, data);
  });
};

const addExercise = (userId, payloadExercise, done) => {
  User.findById(userId, function (error, user) {
    if (error) return console.error(error);
    const exerciseObject = {
      description: payloadExercise.description,
      duration: payloadExercise.duration,
      date:
        !payloadExercise.date || payloadExercise.date === ""
          ? new Date()
          : payloadExercise.date,
    };
    user.log.push(exerciseObject);
    user.save(function (err, data) {
      if (err) return console.error(err);
      done(null, data);
    });
  });
};

const findLogUser = (query, projections, done) => {
  User.findOne(query, projections).exec(function (error, user) {
    done(error, user);
  });
};

module.exports = { createUser, addExercise, findLogUser };
