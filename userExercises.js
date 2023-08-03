require("dotenv").config();
let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    requried: true,
  },
});

let logExerciseSchema = new mongoose.Schema({
  userData: {
    type: Object,
    required: true,
  },
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

let User = mongoose.model("User", userSchema);
let LogExercise = mongoose.model("LogExercise", logExerciseSchema);

const getAllUser = (done) => {
  User.find({}, function (error, data) {
    if (error) console.error(error);
    done(error, data);
  });
};

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
    const addExercise = new LogExercise({
      userData: user,
      description: payloadExercise.description,
      duration: payloadExercise.duration,
      date: payloadExercise.date,
    });
    addExercise.save(function (error, data) {
      const response = {
        _id: data.userData._id,
        username: data.userData.username,
        description: data.description,
        duration: data.duration,
        date: new Date(data.date).toDateString(),
      };
      done(error, response);
    });
  });
};

const findLogUser = (query, done) => {
  // User.findOne(query, projections).exec(function (error, user) {
  //   done(error, user);
  // });
  const { userId, limit, fromDate, toDate } = query;
  const queryLog = {
    "userData._id": mongoose.Types.ObjectId(userId),
  };
  if (fromDate && toDate) {
    queryLog["date"] = { $gte: fromDate, $lte: toDate };
  }
  const findLog = LogExercise.find(queryLog);

  if (limit) {
    findLog.limit(Number(limit));
  }

  findLog.exec(function (error, data) {
    const response = {
      _id: data[0].userData._id,
      username: data[0].userData.username,
      count: data.length,
      log: data.map((log) => {
        const formattedDate = log.date.toDateString();
        return {
          description: log.description,
          duration: log.duration,
          date: formattedDate,
        };
      }),
    };
    done(error, response);
  });
};

module.exports = {
  getAllUser,
  createUser,
  addExercise,
  findLogUser,
};
