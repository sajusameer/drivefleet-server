
const dns = require("node:dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const {
  MongoClient,
} = require("mongodb");

dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================

app.use(cookieParser());

// app.use(
//   cors({
//     origin: [process.env.CLIENT_URL],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://drivefleet-gules.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// =====================
// MONGODB
// =====================

const uri =
  process.env.MONGODB_URI;

const client =
  new MongoClient(uri);

// =====================
// RUN SERVER
// =====================

async function run() {

  try {

    // await client.connect();

    console.log(
      "MongoDB Connected!"
    );

    const db =
      client.db("drivefleet");

    // COLLECTIONS

    const carsCollection =
      db.collection("cars");

    const bookingsCollection =
      db.collection("bookings");

    // =========================
    // ROOT
    // =========================

    
    // =========================
    // ADD CAR
    // =========================

    app.post(
      "/cars",
      async (req, res) => {

        try {

          const carData =
            req.body;

          // CUSTOM STRING ID

          carData._id =
            Date.now().toString();

          // DEFAULT BOOKING COUNT

          carData.booking_count = 0;

          const result =
            await carsCollection.insertOne(
              carData
            );

          res.send(result);

        } catch (error) {

          // console.log(error);

          res.status(500).json({
            message:
              "Failed to add car",
          });

        }

      }
    );

    // =========================
    // GET ALL CARS
    // SEARCH + FILTER
    // =========================


app.get("/cars", async (req, res) => {
  try {

    const search = req.query.search || "";
    const type = req.query.type || "";

    let query = {};

    // SEARCH BY CAR NAME
    if (search) {
      query.carName = {
        $regex: search,
        $options: "i",
      };
    }

    // FILTER BY CAR TYPE
    if (type) {
      query.carType = type;
    }

    const cars = await carsCollection
      .find(query)
      .sort({
        booking_count: -1,
      })
      .toArray();

    res.send(cars);

  } catch (error) {

    console.log(error);

    res.status(500).send({
      message: "Failed to fetch cars",
    });

  }
});

    // =========================
    // GET SINGLE CAR
    // =========================

    app.get(
      "/cars/:id",
      async (req, res) => {

        try {

          const id =
            req.params.id;

          const car =
            await carsCollection.findOne({
              _id: id,
            });

          if (!car) {

            return res.status(404).send({
              message:
                "Car not found",
            });

          }

          res.send(car);

        } catch (error) {

          console.log(error);

          res.status(500).send({
            message:
              "Server error",
          });

        }

      }
    );

    // =========================
    // MY ADDED CARS
    // =========================

    app.get(
      "/my-cars/:email",
      async (req, res) => {

        try {

          const email =
            req.params.email;

          const result =
            await carsCollection
              .find({
                userEmail: email,
              })
              .toArray();

          res.send(result);

        } catch (error) {

          console.log(error);

          res.status(500).json({
            message:
              "Failed to fetch my cars",
          });

        }

      }
    );

    // =========================
    // UPDATE CAR
    // =========================

    app.put(
      "/cars/:id",
      async (req, res) => {

        try {

          const id =
            req.params.id;

          const updatedData =
            req.body;

          const result =
            await carsCollection.updateOne(
              {
                _id: id,
              },
              {
                $set: updatedData,
              }
            );

          res.send(result);

        } catch (error) {

          console.log(error);

          res.status(500).json({
            message:
              "Failed to update car",
          });

        }

      }
    );

    // =========================
    // DELETE CAR
    // =========================

    app.delete(
      "/cars/:id",
      async (req, res) => {

        try {

          const id =
            req.params.id;

          const result =
            await carsCollection.deleteOne({
              _id: id,
            });

          res.send(result);

        } catch (error) {

          console.log(error);

          res.status(500).json({
            message:
              "Failed to delete car",
          });

        }

      }
    );

    // =========================
    // BOOK CAR
    // =========================

    app.post("/bookings", async (req, res) => {
  try {
    const bookingData = req.body;

    const result = await bookingsCollection.insertOne(bookingData);

    console.log("CAR ID:", bookingData.carId);

    const updateResult = await carsCollection.updateOne(
      { _id: bookingData.carId?.trim() },
      {
        $inc: { booking_count: 1 }
      }
    );

    console.log("UPDATE:", updateResult);

    res.send(result);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Booking failed" });
  }
});

    // =========================
    // MY BOOKINGS
    // =========================

    app.get(
      "/my-bookings/:email",
      async (req, res) => {

        try {

          const email =
            req.params.email;

          const result =
            await bookingsCollection
              .find({
                userEmail: email,
              })
              .toArray();

          res.send(result);

        } catch (error) {

          console.log(error);

          res.status(500).json({
            message:
              "Failed to fetch bookings",
          });

        }

      }
    );

  } catch (error) {

    console.log(
      "MongoDB Error:",
      error
    );

  }

}

run();

// =====================
// SERVER
// =====================

app.get("/", (req, res) => {

      res.send(
        "DriveFleet Server Running"
      );

    });


app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});