const express = require("express");
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://online-study-c6231.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hktnvnf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  if (!token) {
    return res.status(401).send({ message: "unauthoried access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthoried access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const database = client.db("assignmentDB");
    const assignmentCollection = database.collection("assignment");
    const submitedFormCollectin = database.collection("submitedForm");
    const myAssignmentCollection = database.collection("myAssignment");

    // post
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("looging out", user);
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // services
    app.post("/assignment", async (req, res) => {
      const newAssignment = req.body;
      // console.log(newAssignment);
      const result = await assignmentCollection.insertOne(newAssignment);
      res.send(result);
    });

    app.get("/assignment", async (req, res) => {
      console.log("coooooooooooooooook", req.cookies);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log("pagination", page, size);
      const cursor = assignmentCollection
        .find()
        .skip(page * size)
        .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/assignment/:id",  async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    app.put("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedAssignment = req.body;
      const assignment = {
        $set: {
          photo: updatedAssignment.photo,
          level: updatedAssignment.level,
          marks: updatedAssignment.marks,
          date: updatedAssignment.date,
          title: updatedAssignment.title,
          description: updatedAssignment.description,
        },
      };
      const result = await assignmentCollection.updateOne(
        filter,
        assignment,
        options
      );
      res.send(result);
    });

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await assignmentCollection.findOne(query);
      res.send(user);
    });

    app.delete("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/assignmentsCount", async (req, res) => {
      console.log("coooooooooooooooook", req.cookies);

      const count = await assignmentCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // submited

    app.post("/submitedForm", async (req, res) => {
      const newSubmitin = req.body;
      // console.log(newSubmitin);
      const result = await submitedFormCollectin.insertOne(newSubmitin);
      res.send(result);
    });

    app.get("/submitedForm", async (req, res) => {
      // const page = parseInt(req.query.page);
      // const size = parseInt(req.query.size);
      // console.log("pagination", page, size);
      const cursor = submitedFormCollectin.find();
      // .skip(page * size)
      // .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/submitedForm/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await submitedFormCollectin.findOne(query);
      res.send(user);
    });

    app.post("/myAssignment", async (req, res) => {
      const newMyAssignment = req.body;
      // console.log(newSubmitin);
      const result = await myAssignmentCollection.insertOne(newMyAssignment);
      res.send(result);
    });

    app.get("/myAssignment", async (req, res) => {
      // const page = parseInt(req.query.page);
      // const size = parseInt(req.query.size);
      // console.log("pagination", page, size);
      const cursor = myAssignmentCollection.find();
      // .skip(page * size)
      // .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myAssignment/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const cursor = myAssignmentCollection.find({ email: email });
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Group-Study-assignment server is running");
});

app.listen(port, () => {
  console.log(`Group-Study-assignment Server is running on port ${port}`);
});
