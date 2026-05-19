const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected!");

    const db = client.db("drivefleet");
    const carsCollection = db.collection("cars");

    app.post("/cars", async (req, res) => {
      const result = await carsCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/cars", async (req, res) => {
      const search = req.query.search || "";
      const type = req.query.type || "";

      let query = {};

      if (search) {
        query.carName = {
          $regex: search,
          $options: "i",
        };
      }

      if (type) {
        query.carType = type;
      }

      const cars = await carsCollection.find(query).toArray();
      res.send(cars);
    });

    app.get("/cars/:id", async (req, res) => {
      const result = await carsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    app.put("/cars/:id", async (req, res) => {
      const result = await carsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.send(result);
    });

    app.delete("/cars/:id", async (req, res) => {
      const result = await carsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

  } catch (error) {
    console.log(error);
  }
}

run();

app.get("/", (req, res) => {
  res.send("DriveFleet Server Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});