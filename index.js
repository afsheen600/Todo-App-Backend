import express from "express";
import path from "path";
import { connection, collectionName } from "./dbconfig.js";
import cors from "cors";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { error } from "console";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://full-stack-todo-app-deployed.netlify.app",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.options("*", cors());

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "https://full-stack-todo-app-deployed.netlify.app",
//     ],
//     credentials: true,
//   })
// );
app.use(cookieParser());

app.post("/signup", async (req, res) => {
  const userData = req.body;

  if (userData.email && userData.password) {
    const db = await connection();
    const collection = db.collection("users");
    const result = await collection.insertOne(userData);

    if (result) {
      jwt.sign(userData, "Google", { expiresIn: "5d" }, (error, token) => {
        res.send({
          success: true,
          message: "signup successfully",
          token,
        });
      });
    } else {
      res.send({
        success: false,
        message: "signup not done",
      });
    }
  }
});

app.post("/login", async (req, res) => {
  const userData = req.body;

  if (userData.email && userData.password) {
    const db = await connection();
    const collection = db.collection("users");
    const result = await collection.findOne({
      email: userData.email,
      password: userData.password,
    });

    if (result) {
      jwt.sign(userData, "Google", { expiresIn: "5d" }, (error, token) => {
        res.send({
          success: true,
          message: "login successfully",
          token,
        });
      });
    } else {
      res.send({
        success: false,
        message: "login failed",
      });
    }
  } else {
    res.send({
      success: false,
      message: "login not successfully",
    });
  }
});

app.post("/add-task", verifyJWTToken, async (req, res) => {
  const db = await connection();
  const collection = db.collection(collectionName);
  const result = await collection.insertOne(req.body);
  res.send("Task added successfully");
});

app.get("/tasks", verifyJWTToken, async (req, res) => {
  const db = await connection();
  console.log("cookies data", req.cookies);
  const collection = db.collection(collectionName);
  const result = await collection.find().toArray();
  if (result) {
    res.send({ message: "new task added", success: true, result });
  } else {
    res.send({ message: "No tasks found", success: false });
  }
});

app.get("/task/:id", verifyJWTToken, async (req, res) => {
  const db = await connection();
  const id = req.params.id;
  const collection = db.collection(collectionName);
  const result = await collection.findOne({ _id: new ObjectId(id) });
  if (result) {
    res.send({ message: "task fetched", success: true, result });
  } else {
    res.send({ message: "No tasks found", success: false });
  }
});

app.put("/update-task/:id", verifyJWTToken, async (req, res) => {
  try {
    const db = await connection();
    const collection = db.collection(collectionName);
    const id = req.params.id;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          Title: req.body.Title,
          Description: req.body.Description,
        },
      }
    );

    if (result.modifiedCount > 0) {
      res.send({ message: "Task updated successfully", success: true });
    } else {
      res.send({ message: "Task not found", success: false });
    }
  } catch (error) {
    res.status(500).send({ message: "Error updating task", success: false });
  }
});

app.delete("/delete/:id", verifyJWTToken, async (req, res) => {
  const db = await connection();
  const id = req.params.id;
  const collection = db.collection(collectionName);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result) {
    res.send({ message: "task deleted", success: true, result });
  } else {
    res.send({ message: "task not found", success: false });
  }
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

function verifyJWTToken(req, res, next) {
  const token = req.cookies["token"];
  jwt.verify(token, "Google", (error, decoded) => {
    if (error) {
      return res.send({
        message: "invalid token",
        success: false,
      });
    }
    console.log(decoded);
    next();
  });
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
