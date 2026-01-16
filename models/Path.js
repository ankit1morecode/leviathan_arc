const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
    x: Number,
    y: Number,
    t: {
        type: Date,
        default: Date.now
    }
},{
    _id: false
});

const pathSchema = new mongoose.Schema({
    robot_id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    points: [pointSchema],
}, { timestamps: true });

module.exports = mongoose.model("Path", pathSchema);
