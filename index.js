const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const process = require("process");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const req = require("express/lib/request");
const res = require("express/lib/response");
const { ObjectID } = require("bson");
const { resolveSoa } = require("dns");
const mongoosePaginate = require("mongoose-paginate-v2");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());

mongoose
  .connect("mongodb://localhost:27017/mapleDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Now we are connected to DataBase");
  })
  .catch((err) => {
    console.log("Error to connect DataBase");
  });

const userSchema = new Schema({
  url: {
    type: String,
    require: true,
  },
  name: String,
  description: String,
  tags: [{ value: String }],
  client: String,
  date: {
    type: Date,
    default: Date.now,
  },
});
userSchema.plugin(mongoosePaginate);
const UserData = new mongoose.model("UserData", userSchema);

//Function for Creating Document
const createDocument = async (Url, Name, Description, Value, Client) => {
  try {
    const userData = new UserData({
      url: Url,
      name: Name,
      description: Description,
      tags: [{ value: Value }],
      client: Client,
    });
    //Save Document
    const result = await userData.save();
    res.status(200);
    return result._id;
  } catch (err) {
    throw err;
    res.status(500);
  }
};

//getDocument
const getDocument = async (value) => {
  const result = await UserData.find({ tags: value }).select({ urls: 1 });
  console.log(result);
  res.send(result);
};
//function for updating document
const updateDocument = async (_id, obj) => {
  try {
    const result = await UserData.findByIdAndUpdate(_id, {
      $set: {
        url: obj.data.url,
        name: obj.data.name,
        description: obj.data.description,
        tags: [{ value: obj.data.tags[0].value }],
        client: obj.client,
      },
    });
    console.log(result);
  } catch (err) {
    console.log(err);
  }
};
//Tagging [01]
app.get("/music/tags/", (req, res) => {
  UserData.find({}, { "tags.value": 1, _id: 0 }, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      console.log(docs[0].tags[0].value);
    }
    res.end("tags");
  });
});
//maintaining POST [01]
app.post("/music", (req, res) => {
  var obj = JSON.parse(req.body);
  var dataID = createDocument(
    obj.data.url,
    obj.data.name,
    obj.data.description,
    obj.data.tags[0].value,
    obj.client
  );

  res.end("All Done" + dataID);
});

//maintaining GET [02]
app.get("/music/:id", (req, res) => {
  UserData.findById(ObjectID(req.params.id))
    .then((doc) => {
      res.status(200);
      res.send(doc);
    })
    .catch((err) => {
      res.status(404);
      res.send(err);
    });
});

//maintaining PUT [03]
// app.put("/music/:id", (req, res) => {
//   UserData.findById(ObjectID(req.params.id))
//     .then((doc) => {
//       res.status(200);
//       res.send(doc);
//       let obj = JSON.parse(req.body);
//       UserData.findByIdAndUpdate(
//         req.params.id,
//         {
//           url: obj.data.url,
//           name: obj.data.name,
//           description: obj.data.description,
//           tags: [{ value: obj.data.tags[0].value }],
//           client: obj.client,
//         },
//         function (err, docs) {
//           if (err) {
//             console.log("in if");
//           } else {
//             res.send(docs);
//           }
//         }
//       );
//     })
//     .catch((err) => {
//       res.status(404);
//       res.send(err);
//     });
// });

//maintaining DELETE [04]
app.delete("/music/", (req, res) => {
  UserData.findByIdAndDelete(req.query.id, function (err, doc) {
    if (err) {
      res.status(204);
      res.send(err);
    } else {
      res.status(200);
      res.send("Deleted :" + doc);
    }
  });
});
//Searching GET[02]
app.get("/music/tag/:tag", (req, res) => {
  const data = req.params.tag;
  UserData.find(
    { "tags.value": data },
    { url: 1, _id: 0 },
    function (err, docs) {
      if (err) {
        console.log("cant find doc");
      } else {
        for (let i = 0; i < docs.length; i++) {
          res.write(i + " " + docs[i].url);
          res.write("\n");
        }
        res.end("All Done");
      }
    }
  );
});

//Searching GET[01]
app.get("/music", (req, res) => {
  var start = parseInt(req.query.start) || 0;
  var size = parseInt(req.query.size) || 5;
  UserData.find({})
    .skip(start * size)
    .limit(size)
    .then((doc) => res.json(doc))
    .catch((err) => console.log(err));
  console.log(`Size : ${size} and start : ${start}`);
  res.end();
});
//Searching GET[03]
app.get("/music/search/:music", (req, res) => {
  const obj = req.params.music;
  UserData.find({ name: obj }, { name: 1, _id: 0 }, (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      console.log(Object.values(docs));
    }
  });
  res.end();
});

app.listen(PORT, function () {
  console.log(`Server is Running on ${PORT}`);
});
// UserData.paginate({}, { limit: size, skip: start }, (err, docs) => {
//   console.log(docs);
// });
// console.log(docs);
