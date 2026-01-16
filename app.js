const express = require("express");

const connectDB = require("./config/db");

const dashboardRoutes = require("./routes/dashboardRoutes");
const recordRoutes = require("./routes/recordRoutes");
const replayRoutes = require("./routes/replayRoutes");
const mapRoutes = require("./routes/mapRoutes");



const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

connectDB();

app.use("/", dashboardRoutes);
app.use("/record", recordRoutes);
app.use("/replay", replayRoutes);
app.use("/map", mapRoutes);

module.exports = app;