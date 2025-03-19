import { message, Spin, Radio } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getExamById } from "../../../apicalls/exams";
import { addReport } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";
import Calculator from "../../../components/Calculator";
import "./WriteExam.css";

function WriteExam() {
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  // For Matching questions, store user's selected radio option as matchAnswer.
  // For others, selectedOptions holds the direct answer (string or array).
  const [selectedOptions, setSelectedOptions] = useState({});
  // "not-visited", "not-answered", "answered", "marked-review"
  const [questionStatus, setQuestionStatus] = useState([]);
  const [result, setResult] = useState({});
  const [view, setView] = useState("instructions");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  // Overlays
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  // Toggle for "How Calculated?" in result
  const [showMarkExplanation, setShowMarkExplanation] = useState(false);

  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);
  // Ref for full-screen container
  const examRef = useRef(null);

  // ==================== GET EXAM DATA ====================
  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({ examId: params.id });
      dispatch(HideLoading());
      if (response.success) {
        setQuestions(response.data.questions || []);
        setExamData(response.data);
        setSecondsLeft(response.data.duration);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // ==================== CALCULATE RESULT ====================
  const calculateResult = async () => {
    try {
      let totalCorrectMarks = 0;
      let totalNegativeMarks = 0;
      const correctAnswers = [];
      const wrongAnswers = [];
      const totalQuestions = questions.length;
      // Tally correct/wrong counts by marks
      const breakdown = {
        1: { correct: 0, wrong: 0 },
        2: { correct: 0, wrong: 0 },
        5: { correct: 0, wrong: 0 },
      };

      questions.forEach((question, index) => {
        const selected = selectedOptions[index];
        const marks = Number(question.marks);
        // If not attempted, skip
        if (selected === undefined || selected === "" || selected === null) {
          return;
        }
        let isCorrect = false;
        if (question.type === "NAT") {
          const answer = parseFloat(selected);
          if (isNaN(answer)) return;
          const natMin = parseFloat(question.natMin);
          const natMax = parseFloat(question.natMax);
          if (answer >= natMin && answer <= natMax) {
            isCorrect = true;
          }
        } else if (question.type === "MSQ") {
          if (
            Array.isArray(selected) &&
            Array.isArray(question.correctOptions) &&
            JSON.stringify(selected.slice().sort()) ===
              JSON.stringify(question.correctOptions.slice().sort())
          ) {
            isCorrect = true;
          }
        } else if (question.type === "Matching") {
          if (
            selected &&
            selected.matchAnswer &&
            String(selected.matchAnswer).trim().toUpperCase() ===
              String(question.matchCorrectOption).trim().toUpperCase()
          ) {
            isCorrect = true;
          }
        } else {
          // MCQ or TrueFalse
          if (
            String(question.correctOption).trim() === String(selected).trim()
          ) {
            isCorrect = true;
          }
        }
        if (isCorrect) {
          totalCorrectMarks += marks;
          correctAnswers.push(question);
          if (breakdown[marks]) breakdown[marks].correct += 1;
        } else {
          // Negative marking
          if (marks === 1) totalNegativeMarks += 1 / 3;
          else if (marks === 2) totalNegativeMarks += 2 / 3;
          wrongAnswers.push(question);
          if (breakdown[marks]) breakdown[marks].wrong += 1;
        }
      });

      let finalScore = totalCorrectMarks - totalNegativeMarks;
      if (isNaN(finalScore)) finalScore = 0;
      finalScore = Math.max(0, finalScore);
      const verdict = finalScore >= examData.passingMarks ? "Pass" : "Fail";
      const calculationDetails = {
        totalQuestions,
        correctCount: correctAnswers.length,
        wrongCount: wrongAnswers.length,
        unattempted:
          totalQuestions - (correctAnswers.length + wrongAnswers.length),
        totalCorrectMarks: totalCorrectMarks.toFixed(2),
        totalNegativeMarks: totalNegativeMarks.toFixed(2),
        finalScore: finalScore.toFixed(2),
        breakdown,
      };
      const tempResult = {
        correctAnswers,
        wrongAnswers,
        obtainedMarks: finalScore,
        verdict,
        calculationDetails,
      };
      setResult(tempResult);
      dispatch(ShowLoading());
      const response = await addReport({
        exam: params.id,
        result: tempResult,
        user: user._id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setView("result");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // ==================== START TIMER ====================
  const startTimer = () => {
    let totalSeconds = examData.duration;
    const id = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds -= 1;
        setSecondsLeft(totalSeconds);
      } else {
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(id);
  };

  // ==================== USE EFFECTS ====================
  useEffect(() => {
    if (timeUp && view === "questions") {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp, view, intervalId]);

  useEffect(() => {
    if (params.id) getExamData();
    // eslint-disable-next-line
  }, [params.id]);

  useEffect(() => {
    if (questions.length > 0) {
      setQuestionStatus(new Array(questions.length).fill("not-visited"));
    }
  }, [questions]);

  // Full-Screen Effect for Exam View
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleSubmitExam();
      }
    };
    if (view === "questions") {
      // Request full-screen on the exam container
      if (examRef.current && examRef.current.requestFullscreen) {
        examRef.current.requestFullscreen();
      }
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [view]);

  // ==================== STATUS HELPERS ====================
  const updateQuestionStatus = (index, newStatus) => {
    setQuestionStatus((prev) => {
      const copy = [...prev];
      copy[index] = newStatus;
      return copy;
    });
  };

  const handleQuestionNavClick = (index) => {
    if (questionStatus[index] === "not-visited") {
      updateQuestionStatus(index, "not-answered");
    }
    setSelectedQuestionIndex(index);
  };

  // ==================== BUTTON HANDLERS ====================
  const handleMarkForReviewAndNext = () => {
    updateQuestionStatus(selectedQuestionIndex, "marked-review");
    if (selectedQuestionIndex < questions.length - 1) {
      handleQuestionNavClick(selectedQuestionIndex + 1);
    }
  };

  const handleClearResponse = () => {
    setSelectedOptions((prev) => {
      const copy = { ...prev };
      delete copy[selectedQuestionIndex];
      return copy;
    });
    updateQuestionStatus(selectedQuestionIndex, "not-answered");
  };

  const handleSaveAndNext = () => {
    if (selectedOptions[selectedQuestionIndex]) {
      updateQuestionStatus(selectedQuestionIndex, "answered");
    } else {
      updateQuestionStatus(selectedQuestionIndex, "not-answered");
    }
    if (selectedQuestionIndex < questions.length - 1) {
      handleQuestionNavClick(selectedQuestionIndex + 1);
    }
  };

  const handleSubmitExam = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    clearInterval(intervalId);
    setTimeUp(true);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ==================== MATCHING COMPONENT ====================
  const MatchingComponent = () => {
    const setAItems =
      currentQuestion.matching &&
      Object.keys(currentQuestion.matching)
        .filter((k) => k.startsWith("A"))
        .map((k) => ({ id: k, label: currentQuestion.matching[k] }));
    const setBItems =
      currentQuestion.matching &&
      Object.keys(currentQuestion.matching)
        .filter((k) => k.startsWith("B"))
        .map((k) => ({ id: k, label: currentQuestion.matching[k] }));
    const matchingOptions = currentQuestion.matchingOptions || {};
    return (
      <div style={{ minHeight: "300px", fontSize: "18px" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "18px" }}>Matching Pairs</h3>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div>
              {setAItems?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    margin: "5px 0",
                    border: "1px solid #000",
                    padding: "5px",
                    fontSize: "18px",
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <div>
              {setBItems?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    margin: "5px 0",
                    border: "1px solid #000",
                    padding: "5px",
                    fontSize: "18px",
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "18px" }}>Select Matching Option</h3>
          <Radio.Group
            value={
              (selectedOptions[selectedQuestionIndex] &&
                selectedOptions[selectedQuestionIndex].matchAnswer) ||
              null
            }
            onChange={(e) =>
              setSelectedOptions({
                ...selectedOptions,
                [selectedQuestionIndex]: {
                  ...selectedOptions[selectedQuestionIndex],
                  matchAnswer: e.target.value,
                },
              })
            }
          >
            {Object.keys(matchingOptions).map((key) => (
              <Radio
                key={key}
                value={key}
                style={{
                  fontSize: "18px",
                  marginBottom: "5px",
                  transform: "scale(0.8)",
                }}
              >
                {key} : {matchingOptions[key]}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      </div>
    );
  };

  const currentQuestion = questions[selectedQuestionIndex];

  // ==================== RENDER ====================
  if (view === "questions" && currentQuestion) {
    return (
      <div
        ref={examRef}
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "#fff",
          fontSize: "18px",
          overflowY: "auto",
        }}
      >
        {/* Top Bar */}
        <div className="top-bar" style={{ fontSize: "18px" }}>
          <div className="left" style={{ fontSize: "18px" }}>
            <a
              href="#"
              onClick={() => setView("instructions")}
              style={{ marginRight: "10px", fontSize: "18px" }}
            >
              View Instructions
            </a>
            <a
              href="#"
              onClick={() => setShowQuestionPaper(!showQuestionPaper)}
              style={{ marginRight: "10px", fontSize: "18px" }}
            >
              Question Paper
            </a>
            <button
              className="calculator"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              Calculator
            </button>
          </div>
          <div className="right" style={{ fontSize: "18px" }}>
            Time Left : {formatTime(secondsLeft)}
          </div>
        </div>
        {/* Question Paper Overlay */}
        {showQuestionPaper && (
          <div className="question-paper-container" style={{ fontSize: "18px" }}>
            <h3>All Questions</h3>
            {questions.map((q, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "5px",
                  border: "1px solid #000",
                  padding: "5px",
                }}
              >
                <h4 style={{ fontSize: "18px" }}>
                  Q.{i + 1}) {q.name}
                </h4>
                {q.image && (
                  <div style={{ textAlign: "center", marginBottom: "5px" }}>
                    <img src={q.image} alt="Question" style={{ maxWidth: "200px" }} />
                  </div>
                )}
                <p style={{ fontStyle: "italic", fontSize: "16px" }}>
                  Type: {q.type}
                </p>
                {(q.type === "MCQ" || q.type === "MSQ") && q.options && (
                  <div style={{ marginLeft: "5px", fontSize: "16px" }}>
                    {Object.keys(q.options).map((optKey) => (
                      <p key={optKey}>
                        {optKey}) {q.options[optKey]}
                      </p>
                    ))}
                  </div>
                )}
                {q.type === "Matching" && q.matching && (
                  <div style={{ marginLeft: "5px", fontSize: "16px" }}>
                    <h5>Set A</h5>
                    {Object.keys(q.matching)
                      .filter((k) => k.startsWith("A"))
                      .map((k) => (
                        <p key={k}>{q.matching[k]}</p>
                      ))}
                    <h5>Set B</h5>
                    {Object.keys(q.matching)
                      .filter((k) => k.startsWith("B"))
                      .map((k) => (
                        <p key={k}>{q.matching[k]}</p>
                      ))}
                    {q.matchingOptions && (
                      <>
                        <h5>Matching Options</h5>
                        {Object.keys(q.matchingOptions).map((mOptKey) => (
                          <p key={mOptKey}>
                            {mOptKey}) {q.matchingOptions[mOptKey]}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                )}
                {q.type === "NAT" && (
                  <p style={{ marginLeft: "5px", fontSize: "16px" }}>
                    <em>
                      (NAT Range: {q.natMin} to {q.natMax})
                    </em>
                  </p>
                )}
                {q.type === "TrueFalse" && (
                  <p style={{ marginLeft: "5px", fontSize: "16px" }}>
                    <em>(True/False question)</em>
                  </p>
                )}
              </div>
            ))}
            <button onClick={() => setShowQuestionPaper(false)} style={{ fontSize: "18px" }}>
              Close
            </button>
          </div>
        )}
        {/* Calculator Overlay */}
        {showCalculator && (
          <div className="calculator-container" style={{ fontSize: "18px" }}>
            <Calculator />
            <button onClick={() => setShowCalculator(false)} style={{ fontSize: "18px" }}>
              Close Calculator
            </button>
          </div>
        )}
        {/* Main Container */}
        <div className="container" style={{ fontSize: "18px" }}>
          {/* Left Section: Questions */}
          <div className="main-content" style={{ fontSize: "18px" }}>
            <div className="question-header-horizontal" style={{ fontSize: "18px" }}>
              <div className="question-no" style={{ fontSize: "18px" }}>
                {selectedQuestionIndex + 1}.
              </div>
              <div className="question-text" style={{ fontSize: "22px", fontWeight: "bold" }}>
                {currentQuestion.name}
              </div>
            </div>
            {currentQuestion.image && (
              <div style={{ textAlign: "center", marginBottom: "5px" }}>
                <img
                  src={currentQuestion.image}
                  alt="Question"
                  style={{ maxWidth: "200px" }}
                />
              </div>
            )}
            {/* Options */}
            <div className="options" style={{ marginTop: "5px" }}>
              {/* NAT */}
              {currentQuestion.type === "NAT" ? (
                <input
                  type="number"
                  placeholder="Enter your answer"
                  value={selectedOptions[selectedQuestionIndex] || ""}
                  onChange={(e) =>
                    setSelectedOptions({
                      ...selectedOptions,
                      [selectedQuestionIndex]: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "18px",
                  }}
                />
              ) : currentQuestion.type === "TrueFalse" ? (
                /* True/False (two boxes) */
                <div style={{ width: "100%" }}>
                  {["True", "False"].map((tf, idx) => (
                    <label
                      key={tf}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #000",
                        padding: "12px",
                        margin: "5px 0",
                        width: "100%",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                    >
                      <input
                        type="radio"
                        name={`question_${selectedQuestionIndex}`}
                        value={tf}
                        checked={
                          selectedOptions[selectedQuestionIndex] === tf
                        }
                        onChange={() =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [selectedQuestionIndex]: tf,
                          })
                        }
                        style={{
                          marginRight: "10px",
                          transform: "scale(0.8)",
                        }}
                      />
                      <span>
                        {idx === 0 ? "A: " : "B: "}
                        {tf}
                      </span>
                    </label>
                  ))}
                </div>
              ) : currentQuestion.type === "Matching" ? (
                <MatchingComponent />
              ) : currentQuestion.type === "MSQ" && currentQuestion.options ? (
                Object.keys(currentQuestion.options).map((optionKey, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #000",
                      padding: "12px",
                      margin: "5px 0",
                      width: "100%",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    <input
                      type="checkbox"
                      name={`question_${selectedQuestionIndex}_${optionKey}`}
                      checked={
                        (selectedOptions[selectedQuestionIndex] || []).includes(
                          optionKey
                        )
                      }
                      onChange={(e) => {
                        const currentVals =
                          selectedOptions[selectedQuestionIndex] || [];
                        if (e.target.checked) {
                          setSelectedOptions({
                            ...selectedOptions,
                            [selectedQuestionIndex]: [
                              ...currentVals,
                              optionKey,
                            ],
                          });
                        } else {
                          setSelectedOptions({
                            ...selectedOptions,
                            [selectedQuestionIndex]: currentVals.filter(
                              (val) => val !== optionKey
                            ),
                          });
                        }
                      }}
                      style={{
                        marginRight: "10px",
                        transform: "scale(0.8)",
                      }}
                    />
                    <span>
                      {optionKey}: {currentQuestion.options[optionKey]}
                    </span>
                  </label>
                ))
              ) : currentQuestion.type === "MCQ" && currentQuestion.options ? (
                Object.keys(currentQuestion.options).map((optionKey, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #000",
                      padding: "12px",
                      margin: "5px 0",
                      width: "100%",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    <input
                      type="radio"
                      name={`question_${selectedQuestionIndex}`}
                      value={optionKey}
                      checked={
                        selectedOptions[selectedQuestionIndex] === optionKey
                      }
                      onChange={() =>
                        setSelectedOptions({
                          ...selectedOptions,
                          [selectedQuestionIndex]: optionKey,
                        })
                      }
                      style={{
                        marginRight: "10px",
                        transform: "scale(0.8)",
                      }}
                    />
                    <span>
                      {optionKey}: {currentQuestion.options[optionKey]}
                    </span>
                  </label>
                ))
              ) : (
                <div style={{ fontSize: "18px" }}>
                  No options available for this question.
                </div>
              )}
            </div>
            {/* Navigation Buttons */}
            <div className="buttons" style={{ fontSize: "18px" }}>
              <button onClick={handleMarkForReviewAndNext}>
                Mark for Review & Next
              </button>
              <button onClick={handleClearResponse}>Clear Response</button>
              <button className="save-next" onClick={handleSaveAndNext}>
                Save & Next
              </button>
            </div>
          </div>
          {/* Right Section: Info Panel */}
          <div className="right-panel" style={{ fontSize: "18px" }}>
            <div className="user-info" style={{ fontSize: "18px" }}>
              <img src="avatar.png" alt="User" />
              <div>{user.name}</div>
            </div>
            <div className="status-info" style={{ fontSize: "18px" }}>
              <div className="status-row">
                <div className="status-box answered"></div>Answered
              </div>
              <div className="status-row">
                <div className="status-box not-answered"></div>Not Answered
              </div>
              <div className="status-row">
                <div className="status-box not-visited"></div>Not Visited
              </div>
              <div className="status-row">
                <div className="status-box marked-review"></div>Marked for Review
              </div>
            </div>
            <div className="section-title" style={{ fontSize: "18px" }}>
              Mechanical Engineering
            </div>
            {/* Question Navigation */}
            <div className="question-nav" style={{ fontSize: "18px" }}>
              {questions.map((q, i) => (
                <button
                  key={i}
                  className={questionStatus[i] || "not-visited"}
                  onClick={() => handleQuestionNavClick(i)}
                  style={{ fontSize: "18px" }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="submit-btn"
              onClick={handleSubmitExam}
              style={{ fontSize: "18px" }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Other Views (Instructions, Result, Review) ====================
  return (
    <div className="mt-2" style={{ fontSize: "18px" }}>
      {view === "instructions" && (
        <>
          <Calculator />
          <Instructions
            examData={examData}
            setView={setView}
            startTimer={startTimer}
          />
        </>
      )}
      {view === "questions" && !currentQuestion && (
        <div
          className="flex justify-center items-center"
          style={{ height: "100vh", fontSize: "18px" }}
        >
          <Spin tip="Loading question..." />
        </div>
      )}
      {view === "result" && (
        <div
          className="flex items-center mt-2 justify-center result"
          style={{ fontSize: "18px" }}
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl" style={{ fontSize: "22px" }}>
              RESULT
            </h1>
            <div className="divider"></div>
            <div className="marks">
              <h1 className="text-md">Total Marks : {examData?.totalMarks}</h1>
              <h1 className="text-md">
                Obtained Marks :{" "}
                {isNaN(result.obtainedMarks)
                  ? 0
                  : Math.round(result.obtainedMarks)}{" "}
                <a
                  href="#"
                  onClick={() =>
                    setShowMarkExplanation(!showMarkExplanation)
                  }
                  style={{
                    marginLeft: "8px",
                    fontSize: "1rem",
                    color: "#0000EE",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  (How Calculated?)
                </a>
              </h1>
              <h1 className="text-md">
                Wrong Answers : {result.wrongAnswers?.length}
              </h1>
              <h1 className="text-md">
                Passing Marks : {examData?.passingMarks}
              </h1>
              <h1 className="text-md">VERDICT : {result.verdict}</h1>
              {showMarkExplanation && result.calculationDetails && (
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    marginTop: "8px",
                    fontSize: "1rem",
                    backgroundColor: "#f0f0f0",
                    color: "#333",
                  }}
                >
                  <p>
                    <strong>Calculation Details:</strong>
                  </p>
                  <ul style={{ marginLeft: "20px" }}>
                    <li>
                      Total Questions: {result.calculationDetails.totalQuestions}
                    </li>
                    <li>
                      Correct Answers: {result.calculationDetails.correctCount}
                    </li>
                    <li>
                      Wrong Answers: {result.calculationDetails.wrongCount}
                    </li>
                    <li>
                      Unattempted: {result.calculationDetails.unattempted}
                    </li>
                    <li>
                      Total Correct Marks:{" "}
                      {result.calculationDetails.totalCorrectMarks}
                    </li>
                    <li>
                      Total Negative Marks:{" "}
                      {result.calculationDetails.totalNegativeMarks}
                    </li>
                    <li>
                      Final Score = Total Correct Marks - Total Negative Marks ={" "}
                      {result.calculationDetails.finalScore}
                    </li>
                    <li>
                      Breakdown by Marks:
                      <ul style={{ marginLeft: "20px" }}>
                        <li>
                          1-mark:{" "}
                          {result.calculationDetails.breakdown["1"].correct} correct,{" "}
                          {result.calculationDetails.breakdown["1"].wrong} wrong
                        </li>
                        <li>
                          2-marks:{" "}
                          {result.calculationDetails.breakdown["2"].correct} correct,{" "}
                          {result.calculationDetails.breakdown["2"].wrong} wrong
                        </li>
                        <li>
                          5-marks:{" "}
                          {result.calculationDetails.breakdown["5"].correct} correct,{" "}
                          {result.calculationDetails.breakdown["5"].wrong} wrong
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  className="primary-outlined-btn"
                  onClick={() => {
                    setView("instructions");
                    setSelectedQuestionIndex(0);
                    setSelectedOptions({});
                    setSecondsLeft(examData.duration);
                  }}
                >
                  Retake Exam
                </button>
                <button
                  className="primary-contained-btn"
                  onClick={() => setView("review")}
                >
                  Review Answers
                </button>
              </div>
            </div>
          </div>
          <div className="lottie-animation">
            {result.verdict === "Pass" && (
              <lottie-player
                src="https://assets2.lottiefiles.com/packages/lf20_ya4ycrti.json"
                background="transparent"
                speed="1"
                loop
                autoplay
              ></lottie-player>
            )}
            {result.verdict === "Fail" && (
              <lottie-player
                src="https://assets4.lottiefiles.com/packages/lf20_qp1spzqv.json"
                background="transparent"
                speed="1"
                loop
                autoplay
              ></lottie-player>
            )}
          </div>
        </div>
      )}
      {view === "review" && (
        <div className="flex flex-col gap-2" style={{ fontSize: "18px" }}>
          <div style={{ marginBottom: "1rem" }}>
            <button
              className="primary-outlined-btn"
              onClick={() => setView("result")}
            >
              Back to Result
            </button>
          </div>
          {questions.map((question, i) => {
            let submittedAnswer;
            if (question.type === "Matching") {
              submittedAnswer = selectedOptions[i]
                ? selectedOptions[i].matchAnswer
                : "Not Attempted";
            } else if (
              selectedOptions[i] === undefined ||
              selectedOptions[i] === ""
            ) {
              submittedAnswer = "Not Attempted";
            } else {
              submittedAnswer = selectedOptions[i];
            }
            let isCorrect = false;
            if (question.type === "NAT") {
              const userVal = parseFloat(submittedAnswer);
              const minVal = parseFloat(question.natMin);
              const maxVal = parseFloat(question.natMax);
              isCorrect = userVal >= minVal && userVal <= maxVal;
            } else if (question.type === "MSQ") {
              if (
                Array.isArray(submittedAnswer) &&
                Array.isArray(question.correctOptions) &&
                JSON.stringify(submittedAnswer.slice().sort()) ===
                  JSON.stringify(question.correctOptions.slice().sort())
              ) {
                isCorrect = true;
              }
            } else if (question.type === "Matching") {
              if (
                submittedAnswer &&
                String(submittedAnswer).trim().toUpperCase() ===
                  String(question.matchCorrectOption).trim().toUpperCase()
              ) {
                isCorrect = true;
              }
            } else {
              isCorrect =
                String(question.correctOption).trim() ===
                String(submittedAnswer).trim();
            }
            return (
              <div
                key={i}
                className={`flex flex-col gap-1 p-2 ${
                  isCorrect ? "bg-success" : "bg-error"
                }`}
                style={{ fontSize: "18px" }}
              >
                <h1 className="text-xl" style={{ fontSize: "20px" }}>
                  {i + 1} : {question.name}
                </h1>
                {question.image && (
                  <img
                    src={question.image}
                    alt="Question"
                    style={{ maxWidth: "200px" }}
                  />
                )}
                {question.type === "NAT" ? (
                  <h1 className="text-md" style={{ fontSize: "18px" }}>
                    Submitted Answer : {submittedAnswer || "Not Attempted"}
                  </h1>
                ) : (
                  <h1 className="text-md" style={{ fontSize: "18px" }}>
                    Submitted Answer : {submittedAnswer}{" "}
                    {question.options
                      ? `- ${question.options[submittedAnswer] || ""}`
                      : ""}
                  </h1>
                )}
                <h1 className="text-md" style={{ fontSize: "18px" }}>
                  Correct Answer :{" "}
                  {question.type === "Matching"
                    ? question.matchCorrectOption
                    : question.correctOption}{" "}
                  {question.options
                    ? `- ${
                        question.options[
                          question.type === "Matching"
                            ? question.matchCorrectOption
                            : question.correctOption
                        ] || ""
                      }`
                    : ""}
                </h1>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WriteExam;
