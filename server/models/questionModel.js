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
    // For NAT (Numerical Answer Type) questions, a numerical answer is required.
    natAnswer: {
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
