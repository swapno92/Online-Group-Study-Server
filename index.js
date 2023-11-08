const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hktnvnf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    await client.connect();
    const database = client.db("assignmentDB");
    const assignmentCollection = database.collection("assignment");
    const submitedFormCollectin = database.collection("submitedForm");
    const myAssignmentCollection = database.collection("myAssignment");

    app.post("/assignment", async (req, res) => {
      const newAssignment = req.body;
      // console.log(newAssignment);
      const result = await assignmentCollection.insertOne(newAssignment);
      res.send(result);
    });

    app.get("/assignment", async (req, res) => {
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

    app.get("/assignment/:id", async (req, res) => {
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

       app.get("/myAssignment/:email", async (req, res) => {
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
