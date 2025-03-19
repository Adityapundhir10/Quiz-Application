const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["MCQ", "MSQ", "NAT", "TrueFalse", "Matching"],
    },
    // Add marks field here
    marks: {
      type: Number,
      required: true,
    },
    // For MCQ and MSQ questions, options are required.
    options: {
      type: Object,
      required: function () {
        return ["MCQ", "MSQ"].includes(this.type);
      },
    },
    // For MCQ and TrueFalse questions, correctOption is required.
    correctOption: {
      type: String,
      required: function () {
        return ["MCQ", "TrueFalse"].includes(this.type);
      },
    },
    // For MSQ questions, an array of correct options is required.
    correctOptions: {
      type: [String],
      required: function () {
        return this.type === "MSQ";
      },
    },
    // For NAT questions, a minimum and maximum acceptable answer are required.
    natMin: {
      type: Number,
      required: function () {
        return this.type === "NAT";
      },
    },
    natMax: {
      type: Number,
      required: function () {
        return this.type === "NAT";
      },
    },
    // For Matching questions, a matching object is required.
    matching: {
      type: Object,
      required: function () {
        return this.type === "Matching";
      },
    },
    // NEW FIELDS: For Matching (MCQ style)
    matchingOptions: {
      type: Object,
      required: function () {
        return this.type === "Matching";
      },
    },
    matchCorrectOption: {
      type: String,
      required: function () {
        return this.type === "Matching";
      },
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "exams",
      required: true,
    },
    // Field to store the image path (if uploaded)
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("questions", questionSchema);
module.exports = Question;
