const router = require("express").Router();
const Exam = require("../models/examModel");
const authMiddleware = require("../middlewares/authMiddleware");
const Question = require("../models/questionModel");

/**
 * ROUTE: /add
 * DESC: Add a new exam
 */
router.post("/add", authMiddleware, async (req, res) => {
  try {
    // 1. Check if exam already exists by name
    const examExists = await Exam.findOne({ name: req.body.name });
    if (examExists) {
      return res
        .status(200)
        .send({ message: "Exam already exists", success: false });
    }

    // 2. Initialize an empty questions array
    req.body.questions = [];

    // 3. Create and save the new exam
    const newExam = new Exam(req.body);
    await newExam.save();

    // 4. Respond with success
    res.send({
      message: "Exam added successfully",
      success: true,
    });
  } catch (error) {
    // 5. Handle errors
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /get-all-exams
 * DESC: Get all exams
 */
router.post("/get-all-exams", authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find({});
    res.send({
      message: "Exams fetched successfully",
      data: exams,
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /get-exam-by-id
 * DESC: Get a single exam by ID (and populate its questions)
 */
router.post("/get-exam-by-id", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.body.examId).populate("questions");
    res.send({
      message: "Exam fetched successfully",
      data: exam,
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /edit-exam-by-id
 * DESC: Edit an existing exam by ID
 */
router.post("/edit-exam-by-id", authMiddleware, async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.body.examId, req.body);
    res.send({
      message: "Exam edited successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /delete-exam-by-id
 * DESC: Delete an exam by ID
 */
router.post("/delete-exam-by-id", authMiddleware, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.body.examId);
    res.send({
      message: "Exam deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /add-question-to-exam
 * DESC: Add a new question to a specific exam
 */
router.post("/add-question-to-exam", authMiddleware, async (req, res) => {
  try {
    // IMPORTANT: Include 'marks' in the payload
    const payload = {
      name: req.body.name,
      type: req.body.type,
      exam: req.body.exam,
      image: req.body.image || "",
      marks: req.body.marks, // <-- REQUIRED to fix validation error
      options: req.body.options,
      correctOption: req.body.correctOption,
      correctOptions: req.body.correctOptions,
      matching: req.body.matching,
    };

    // For NAT questions, include natMin / natMax
    if (req.body.type === "NAT") {
      payload.natMin = req.body.natMin;
      payload.natMax = req.body.natMax;
    }

    // For Matching questions, include matchingOptions / matchCorrectOption
    if (req.body.type === "Matching") {
      payload.matchingOptions = req.body.matchingOptions;
      payload.matchCorrectOption = req.body.matchCorrectOption;
    }

    // Create the new question in the database
    const newQuestion = new Question(payload);
    const question = await newQuestion.save();

    // Add question ID to the exam's 'questions' array
    const exam = await Exam.findById(req.body.exam);
    exam.questions.push(question._id);
    await exam.save();

    res.send({
      message: "Question added successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /edit-question-in-exam
 * DESC: Edit an existing question in a specific exam
 */
router.post("/edit-question-in-exam", authMiddleware, async (req, res) => {
  try {
    const { questionId, ...updateFields } = req.body;
    await Question.findByIdAndUpdate(questionId, updateFields);
    res.send({
      message: "Question edited successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

/**
 * ROUTE: /delete-question-in-exam
 * DESC: Delete a question from a specific exam
 */
router.post("/delete-question-in-exam", authMiddleware, async (req, res) => {
  try {
    // 1. Remove the question document
    await Question.findByIdAndDelete(req.body.questionId);

    // 2. Remove the question ID from the exam's questions array
    const exam = await Exam.findById(req.body.examId);
    exam.questions = exam.questions.filter(
      (question) => question._id.toString() !== req.body.questionId
    );

    // 3. Save the updated exam
    await exam.save();

    res.send({
      message: "Question deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

module.exports = router;
