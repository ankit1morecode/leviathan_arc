const express = require("express");

const connectDB = require("./config/db");

const dashboardRoutes = require("./routes/dashboardRoutes");
const mapRoutes = require("./routes/mapRoutes");
const gpsPathRoutes = require("./routes/gpsPathRoutes");
const cameraRoutes = require("./routes/cameraRoutes");
const cmdRoutes = require("./routes/cmdRoutes");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/", dashboardRoutes);
app.use("/map", mapRoutes);
app.use("/api/gpspath", gpsPathRoutes);
app.use("/camera", cameraRoutes);
app.use("/api/cmd", cmdRoutes);

module.exports = app;