// client/src/pages/user/WriteExam/MatchTheFollowing.jsx

import React, { useState, useEffect } from "react";
import { Radio, Button, message } from "antd";

function MatchTheFollowing({ question, onSubmitAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState("");

  // Log the question data to ensure it has the expected keys.
  useEffect(() => {
    console.log("Matching question data:", question);
  }, [question]);

  const handleSubmit = () => {
    if (!selectedAnswer) {
      message.error("Please select an option");
      return;
    }
    // You can compare selectedAnswer with question.matchCorrectOption here if needed.
    onSubmitAnswer(selectedAnswer);
  };

  return (
    <div style={{ margin: "20px", fontFamily: "Arial, sans-serif" }}>
      <h3>{question.name}</h3>
      <p>
        <strong>Marks:</strong> {question.marks}
      </p>

      {/* Render matching sets in side-by-side boxes */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h4 style={{ marginBottom: "12px" }}>Set A</h4>
          <p style={{ margin: "4px 0" }}>{question.matching?.A1}</p>
          <p style={{ margin: "4px 0" }}>{question.matching?.A2}</p>
          <p style={{ margin: "4px 0" }}>{question.matching?.A3}</p>
          <p style={{ margin: "4px 0" }}>{question.matching?.A4}</p>
        </div>
        <div
          style={{
            flex: 1,
            border: "1px solid #ccc",
            padding: "12px",
            borderRadius: "4px",
          }}
        >
          <h4 style={{ marginBottom: "12px" }}>Set B</h4>
          <p style={{ margin: "4px 0" }}>{question.matching?.B1}</p>
          <p style={{ margin: "4px 0" }}>{question.matching?.B2}</p>
          <p style={{ margin: "4px 0" }}>{question.matching?.B3}</p>
          <p style={{ margin: "4px 0" }}>{question.matching?.B4}</p>
        </div>
      </div>

      {/* Render the Matching Options (MCQ style) */}
      <h4>Select the correct matching option:</h4>
      <Radio.Group
        onChange={(e) => setSelectedAnswer(e.target.value)}
        value={selectedAnswer}
        style={{ marginBottom: "20px", fontSize: "16px" }}
      >
        <Radio value="A">
          A) {question.matchingOptions?.A}
        </Radio>
        <Radio value="B">
          B) {question.matchingOptions?.B}
        </Radio>
        <Radio value="C">
          C) {question.matchingOptions?.C}
        </Radio>
        <Radio value="D">
          D) {question.matchingOptions?.D}
        </Radio>
      </Radio.Group>

      <Button type="primary" onClick={handleSubmit}>
        Submit Answer
      </Button>
    </div>
  );
}

export default MatchTheFollowing;
