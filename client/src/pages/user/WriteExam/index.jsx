import { message, Spin } from "antd";
import React, { useEffect, useState } from "react";
import Xarrow from "react-xarrows"; // for drawing arrows
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getExamById } from "../../../apicalls/exams";
import { addReport } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";

// 1) Import the Calculator component
import Calculator from "../../../components/Calculator";

function WriteExam() {
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  // For non-matching questions, selectedOptions holds the chosen option (or value) for each question.
  const [selectedOptions, setSelectedOptions] = useState({});
  const [result, setResult] = useState({});
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [view, setView] = useState("instructions");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const { user } = useSelector((state) => state.users);

  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({ examId: params.id });
      dispatch(HideLoading());
      console.log("Exam API response:", response);
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

  const calculateResult = async () => {
    try {
      let correctAnswers = [];
      let wrongAnswers = [];

      questions.forEach((question, index) => {
        if (question.type === "NAT") {
          if (Number(selectedOptions[index]) === question.natAnswer) {
            correctAnswers.push(question);
          } else {
            wrongAnswers.push(question);
          }
        } else if (question.type === "Matching") {
          // Here we assume a matching answer is valid if at least one match is provided.
          if (selectedOptions[index] && selectedOptions[index].matches.length > 0) {
            correctAnswers.push(question);
          } else {
            wrongAnswers.push(question);
          }
        } else {
          if (question.correctOption === selectedOptions[index]) {
            correctAnswers.push(question);
          } else {
            wrongAnswers.push(question);
          }
        }
      });

      const obtainedMarks =
        (correctAnswers.length / questions.length) * examData.totalMarks;
      const verdict = obtainedMarks >= examData.passingMarks ? "Pass" : "Fail";

      const tempResult = {
        correctAnswers,
        wrongAnswers,
        obtainedMarks,
        verdict,
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

  const startTimer = () => {
    let totalSeconds = examData.duration;
    const id = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds = totalSeconds - 1;
        setSecondsLeft(totalSeconds);
      } else {
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(id);
  };

  useEffect(() => {
    if (timeUp && view === "questions") {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp, view, intervalId]);

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
    // eslint-disable-next-line
  }, [params.id]);

  if (!examData) {
    return (
      <div className="flex justify-center items-center" style={{ height: "100vh" }}>
        <Spin tip="Loading exam data..." />
      </div>
    );
  }

  const currentQuestion = questions[selectedQuestionIndex];

  // The MatchingComponent for matching-type questions
  const MatchingComponent = () => {
    const [selectedA, setSelectedA] = useState(null);
    const [matches, setMatches] = useState([]);
    const placeholderId = "tempPlaceholder";

    const setAItems =
      currentQuestion.matching &&
      Object.keys(currentQuestion.matching)
        .filter((key) => key.startsWith("A"))
        .map((key) => ({ id: key, label: currentQuestion.matching[key] }));
    const setBItems =
      currentQuestion.matching &&
      Object.keys(currentQuestion.matching)
        .filter((key) => key.startsWith("B"))
        .map((key) => ({ id: key, label: currentQuestion.matching[key] }));

    const handleClickA = (id) => {
      setSelectedA(id);
    };

    const handleClickB = (id) => {
      if (selectedA) {
        setMatches([...matches, { a: selectedA, b: id }]);
        setSelectedA(null);
      }
    };

    // Save the matching pairs for this question in the global state
    useEffect(() => {
      setSelectedOptions((prev) => ({
        ...prev,
        [selectedQuestionIndex]: { matches },
      }));
      // eslint-disable-next-line
    }, [matches]);

    return (
      <div style={{ position: "relative", minHeight: "300px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "50px" }}>
          {/* Set A Column */}
          <div>
            <h3>Set A</h3>
            {setAItems &&
              setAItems.map((item) => (
                <div
                  key={item.id}
                  id={item.id}
                  onClick={() => handleClickA(item.id)}
                  style={{
                    margin: "10px",
                    cursor: "pointer",
                    backgroundColor: selectedA === item.id ? "#f0f0f0" : "white",
                    border: "1px solid #ccc",
                    padding: "5px",
                  }}
                >
                  {item.label}
                </div>
              ))}
          </div>
          {/* Set B Column */}
          <div>
            <h3>Set B</h3>
            {setBItems &&
              setBItems.map((item) => (
                <div
                  key={item.id}
                  id={item.id}
                  onClick={() => handleClickB(item.id)}
                  style={{
                    margin: "10px",
                    cursor: "pointer",
                    border: "1px solid #ccc",
                    padding: "5px",
                  }}
                >
                  {item.label}
                </div>
              ))}
          </div>
        </div>

        {/* Placeholder element in the center */}
        <div
          id={placeholderId}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "0",
            height: "0",
          }}
        ></div>

        {/* Temporary arrow if Set A is selected */}
        {selectedA && (
          <Xarrow start={selectedA} end={placeholderId} strokeWidth={2} color="red" />
        )}
        {/* Confirmed match arrows */}
        {matches.map((match, idx) => (
          <Xarrow
            key={idx}
            start={match.a}
            end={match.b}
            strokeWidth={2}
            color="blue"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-2">
      <div className="divider"></div>
      <h1 className="text-center">{examData.name}</h1>
      <div className="divider"></div>

      {/* 2) Place the Calculator here */}
      <Calculator />

      {view === "instructions" && (
        <Instructions examData={examData} setView={setView} startTimer={startTimer} />
      )}

      {view === "questions" && currentQuestion && (
        <div className="flex flex-col gap-2">
          {currentQuestion.image && (
            <div className="flex justify-center">
              <img
                src={currentQuestion.image}
                alt="Question"
                style={{ maxWidth: "300px", marginBottom: "1rem" }}
              />
            </div>
          )}
          <div className="flex justify-between">
            <h1 className="text-2xl">
              {selectedQuestionIndex + 1} : {currentQuestion.name}
            </h1>
            <div className="timer">
              <span className="text-2xl">{secondsLeft}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {currentQuestion.type === "NAT" ? (
              <div>
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
                  className="w-full p-2 border rounded"
                />
              </div>
            ) : currentQuestion.type === "TrueFalse" ? (
              <div className="flex gap-4">
                <label>
                  <input
                    type="radio"
                    name={`question_${selectedQuestionIndex}`}
                    value="True"
                    checked={selectedOptions[selectedQuestionIndex] === "True"}
                    onChange={() =>
                      setSelectedOptions({
                        ...selectedOptions,
                        [selectedQuestionIndex]: "True",
                      })
                    }
                  />
                  True
                </label>
                <label>
                  <input
                    type="radio"
                    name={`question_${selectedQuestionIndex}`}
                    value="False"
                    checked={selectedOptions[selectedQuestionIndex] === "False"}
                    onChange={() =>
                      setSelectedOptions({
                        ...selectedOptions,
                        [selectedQuestionIndex]: "False",
                      })
                    }
                  />
                  False
                </label>
              </div>
            ) : currentQuestion.type === "Matching" ? (
              <MatchingComponent />
            ) : currentQuestion.options ? (
              Object.keys(currentQuestion.options).map((option, index) => (
                <div
                  className={`flex gap-2 flex-col ${
                    selectedOptions[selectedQuestionIndex] === option
                      ? "selected-option"
                      : "option"
                  }`}
                  key={index}
                  onClick={() =>
                    setSelectedOptions({
                      ...selectedOptions,
                      [selectedQuestionIndex]: option,
                    })
                  }
                >
                  <h1 className="text-xl">
                    {option} : {currentQuestion.options[option]}
                  </h1>
                </div>
              ))
            ) : (
              <div>No options available for this question.</div>
            )}
          </div>

          <div className="flex justify-between">
            {selectedQuestionIndex > 0 && (
              <button
                className="primary-outlined-btn"
                onClick={() => setSelectedQuestionIndex(selectedQuestionIndex - 1)}
              >
                Previous
              </button>
            )}
            {selectedQuestionIndex < questions.length - 1 && (
              <button
                className="primary-contained-btn"
                onClick={() => setSelectedQuestionIndex(selectedQuestionIndex + 1)}
              >
                Next
              </button>
            )}
            {selectedQuestionIndex === questions.length - 1 && (
              <button
                className="primary-contained-btn"
                onClick={() => {
                  clearInterval(intervalId);
                  setTimeUp(true);
                }}
              >
                Submit
              </button>
            )}
          </div>
        </div>
      )}

      {view === "result" && (
        <div className="flex items-center mt-2 justify-center result">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl">RESULT</h1>
            <div className="divider"></div>
            <div className="marks">
              <h1 className="text-md">Total Marks : {examData.totalMarks}</h1>
              <h1 className="text-md">
                Obtained Marks : {Math.round(result.obtainedMarks)}
              </h1>
              <h1 className="text-md">
                Wrong Answers : {result.wrongAnswers.length}
              </h1>
              <h1 className="text-md">
                Passing Marks : {examData.passingMarks}
              </h1>
              <h1 className="text-md">VERDICT : {result.verdict}</h1>
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
        <div className="flex flex-col gap-2">
          {questions.map((question, index) => {
            const isCorrect =
              question.type === "NAT"
                ? Number(selectedOptions[index]) === question.natAnswer
                : question.correctOption === selectedOptions[index];
            return (
              <div
                className={`flex flex-col gap-1 p-2 ${
                  isCorrect ? "bg-success" : "bg-error"
                }`}
                key={index}
              >
                <h1 className="text-xl">
                  {index + 1} : {question.name}
                </h1>
                {question.image && (
                  <img
                    src={question.image}
                    alt="Question"
                    style={{ maxWidth: "200px" }}
                  />
                )}
                {question.type === "NAT" ? (
                  <h1 className="text-md">
                    Submitted Answer : {selectedOptions[index]}
                  </h1>
                ) : (
                  <h1 className="text-md">
                    Submitted Answer : {selectedOptions[index]} -{" "}
                    {question.options
                      ? question.options[selectedOptions[index]]
                      : "N/A"}
                  </h1>
                )}
                <h1 className="text-md">
                  Correct Answer : {question.correctOption} -{" "}
                  {question.options
                    ? question.options[question.correctOption]
                    : ""}
                </h1>
              </div>
            );
          })}
          <div className="flex justify-center gap-2">
            <button className="primary-outlined-btn" onClick={() => navigate("/")}>
              Close
            </button>
            <button
              className="primary-contained-btn"
              onClick={() => {
                setView("instructions");
                setSelectedQuestionIndex(0);
                setSelectedOptions({});
                setSecondsLeft(examData.duration);
              }}
            >
              Retake Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WriteExam;
