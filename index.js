const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// =====================
// MIDDLEWARE
// =====================

app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

// =====================
// MONGODB
// =====================

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();

    console.log("MongoDB Connected!");

    const db = client.db("drivefleet");

    const usersCollection = db.collection("users");
    const carsCollection = db.collection("cars");
    const bookingsCollection = db.collection("bookings");

    // =========================
    // ROOT
    // =========================

    app.get("/", (req, res) => {
      res.send("DriveFleet Server Running");
    });

    // =========================
    // ADD CAR
    // =========================

    app.post("/cars", async (req, res) => {
      try {
        const carData = req.body;

        // STRING ID
        carData._id = Date.now().toString();

        carData.booking_count = 0;

        const result = await carsCollection.insertOne(carData);

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Failed to add car",
        });
      }
    });

    // =========================
    // GET ALL CARS
    // =========================

    app.get("/cars", async (req, res) => {
      try {
        const cars = await carsCollection.find({}).toArray();

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

    app.get("/cars/:id", async (req, res) => {
  try {

    const id = req.params.id;

    const cars = await carsCollection.find({}).toArray();

    const car = cars.find(
      (singleCar) => singleCar._id.toString() === id
    );

    if (!car) {
      return res.status(404).send({
        message: "Car not found",
      });
    }

    res.send(car);

  } catch (error) {
    console.log(error);

    res.status(500).send({
      message: "Server error",
    });
  }
});

    // =========================
    // MY CARS
    // =========================

    app.get("/my-cars/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await carsCollection
          .find({
            userEmail: email,
          })
          .toArray();

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Failed to fetch my cars",
        });
      }
    });

    // =========================
    // UPDATE CAR
    // =========================

    app.put("/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await carsCollection.updateOne(
          {
            _id: id,
          },
          {
            $set: req.body,
          }
        );

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Failed to update car",
        });
      }
    });

    // =========================
    // DELETE CAR
    // =========================

    app.delete("/cars/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await carsCollection.deleteOne({
          _id: id,
        });

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Failed to delete car",
        });
      }
    });

    // =========================
    // BOOK CAR
    // =========================

    app.post("/bookings", async (req, res) => {
      try {
        const bookingData = req.body;

        const result = await bookingsCollection.insertOne(
          bookingData
        );

        await carsCollection.updateOne(
          {
            _id: bookingData.carId,
          },
          {
            $inc: {
              booking_count: 1,
            },
          }
        );

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Booking failed",
        });
      }
    });

    // =========================
    // REGISTER
    // =========================

//     app.post("/register", async (req, res) => {
//       try {
//         const { name, email, photo, password } = req.body;

//         const existingUser = await usersCollection.findOne({
//           email,
//         });

//         if (existingUser) {
//           return res.status(400).send({
//             message: "User already exists",
//           });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const newUser = {
//           name,
//           email,
//           photo,
//           password: hashedPassword,
//           createdAt: new Date(),
//         };

//         const result = await usersCollection.insertOne(
//           newUser
//         );

//         res.send({
//           success: true,
//           message: "User registered successfully",
//           result,
//         });

//       } catch (error) {
//         console.log(error);

//         res.status(500).send({
//           message: "Registration failed",
//         });
//       }
//     });


//     // login
//     // =========================
// // LOGIN
// // =========================

// app.post("/login", async (req, res) => {

//   try {

//     const { email, password } = req.body;

//     // FIND USER

//     const user = await usersCollection.findOne({
//       email,
//     });

//     if (!user) {

//       return res.status(404).send({
//         message: "User not found",
//       });

//     }

//     // CHECK PASSWORD

//     const isPasswordValid =
//       await bcrypt.compare(
//         password,
//         user.password
//       );

//     if (!isPasswordValid) {

//       return res.status(401).send({
//         message: "Invalid password",
//       });

//     }

    // REMOVE PASSWORD

//     const { password: pass, ...userData } =
//       user;

//     res.send({
//       success: true,
//       message: "Login successful",
//       user: userData,
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).send({
//       message: "Login failed",
//     });

//   }

// });

    // =========================
    // MY BOOKINGS
    // =========================

    app.get("/my-bookings/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await bookingsCollection
          .find({
            userEmail: email,
          })
          .toArray();

        res.send(result);

      } catch (error) {
        console.log(error);

        res.status(500).json({
          message: "Failed to fetch bookings",
        });
      }
    });

  } catch (error) {
    console.log("MongoDB Error:", error);
  }
}

run();

// =====================
// SERVER
// =====================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});