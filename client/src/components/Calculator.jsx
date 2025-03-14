import React, { useState } from "react";
import { create, all } from "mathjs";

// Create a mathjs instance
const config = {};
const math = create(all, config);

export default function Calculator() {
  // Show/hide the entire calculator
  const [showCalculator, setShowCalculator] = useState(false);

  // The main display expression
  const [expression, setExpression] = useState("0");

  // Memory storage
  const [memory, setMemory] = useState(0);

  // Degrees vs Radians
  const [angleMode, setAngleMode] = useState("Deg");

  // Toggle the calculator
  const toggleCalculator = () => {
    setShowCalculator(!showCalculator);
  };

  // Append text to the current expression
  const append = (val) => {
    setExpression((prev) => {
      // If currently "0" or "Error", replace it
      if (prev === "0" || prev === "Error") return val;
      return prev + val;
    });
  };

  // Clear entire expression
  const clearAll = () => {
    setExpression("0");
  };

  // "Back arrow" – remove last character
  const backspace = () => {
    setExpression((prev) => {
      if (prev.length === 1 || prev === "Error") return "0";
      return prev.slice(0, -1);
    });
  };

  // Evaluate the expression using mathjs
  const evaluateExpression = () => {
    try {
      let result;
      if (angleMode === "Deg") {
        // Convert trig calls from deg to rad
        const exprInRadians = expression
          .replace(/\bsin\(([^)]+)\)/g, "sin(($1)*pi/180)")
          .replace(/\bcos\(([^)]+)\)/g, "cos(($1)*pi/180)")
          .replace(/\btan\(([^)]+)\)/g, "tan(($1)*pi/180)")
          .replace(/\bsinh\(([^)]+)\)/g, "sinh(($1)*pi/180)")
          .replace(/\bcosh\(([^)]+)\)/g, "cosh(($1)*pi/180)")
          .replace(/\btanh\(([^)]+)\)/g, "tanh(($1)*pi/180)");
        result = math.evaluate(exprInRadians);
      } else {
        // Radians mode
        result = math.evaluate(expression);
      }
      setExpression(String(result));
    } catch (err) {
      setExpression("Error");
    }
  };

  // Toggle angle mode
  const toggleAngleMode = () => {
    setAngleMode((prev) => (prev === "Deg" ? "Rad" : "Deg"));
  };

  // Memory functions
  const memoryClear = () => setMemory(0);
  const memoryRecall = () => setExpression(String(memory));
  const memoryStore = () => {
    try {
      const val = math.evaluate(expression);
      setMemory(val);
    } catch {
      setMemory(0);
    }
  };
  const memoryAdd = () => {
    try {
      const val = math.evaluate(expression);
      setMemory(memory + val);
    } catch {
      // do nothing
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Small calculator icon (button) to open/close */}
      <button
        onClick={toggleCalculator}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#007ACC",
          color: "#fff",
          fontSize: "1rem",
          cursor: "pointer",
          border: "none",
        }}
        title="Open Calculator"
      >
        &#128425;
      </button>

      {showCalculator && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: 0,
            // Increase the width here to make it larger
            width: "800px",
            background: "#e6e6e6",
            border: "1px solid #ccc",
            borderRadius: "5px",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            zIndex: 9999,
            fontFamily: "sans-serif",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#007ACC",
              color: "#fff",
              padding: "5px 10px",
              justifyContent: "space-between",
              borderTopLeftRadius: "5px",
              borderTopRightRadius: "5px",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Scientific Calculator</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={{
                  background: "#58a6ff",
                  border: "none",
                  color: "#fff",
                  padding: "3px 10px",
                  cursor: "pointer",
                  borderRadius: "3px",
                }}
                onClick={() => alert("Help clicked!")}
              >
                Help
              </button>
              <button
                style={{
                  background: "#ff5c5c",
                  border: "none",
                  color: "#fff",
                  padding: "3px 10px",
                  cursor: "pointer",
                  borderRadius: "3px",
                }}
                onClick={toggleCalculator}
              >
                X
              </button>
            </div>
          </div>

          {/* Display */}
          <div style={{ padding: "5px 10px" }}>
            <input
              type="text"
              value={expression}
              readOnly
              style={{
                width: "100%",
                height: "50px",
                fontSize: "1.2rem",
                textAlign: "right",
                padding: "5px 10px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Row: mod, angle mode */}
          <div style={{ padding: "0 10px", display: "flex", gap: "10px" }}>
            <button style={buttonStyle} onClick={() => append("mod")}>
              mod
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "#f0f0f0",
                padding: "0 8px",
                borderRadius: "3px",
              }}
            >
              <label style={{ fontSize: "0.9rem", marginRight: "5px" }}>
                <input
                  type="radio"
                  name="angle"
                  checked={angleMode === "Deg"}
                  onChange={toggleAngleMode}
                />
                Deg
              </label>
              <label style={{ fontSize: "0.9rem" }}>
                <input
                  type="radio"
                  name="angle"
                  checked={angleMode === "Rad"}
                  onChange={toggleAngleMode}
                />
                Rad
              </label>
            </div>
          </div>

          {/* Row: memory buttons */}
          <div style={{ padding: "5px 10px", display: "flex", gap: "5px" }}>
            <button style={buttonStyle} onClick={memoryClear}>
              MC
            </button>
            <button style={buttonStyle} onClick={memoryRecall}>
              MR
            </button>
            <button style={buttonStyle} onClick={memoryStore}>
              MS
            </button>
            <button style={buttonStyle} onClick={memoryAdd}>
              M+
            </button>
          </div>

          {/* Buttons Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: "5px",
              padding: "5px 10px 10px 10px",
            }}
          >
            {/* Row 1 */}
            <button style={buttonStyle} onClick={() => append("sinh(")}>
              sinh
            </button>
            <button style={buttonStyle} onClick={() => append("cosh(")}>
              cosh
            </button>
            <button style={buttonStyle} onClick={() => append("tanh(")}>
              tanh
            </button>
            <button style={buttonStyle} onClick={() => append("Exp(")}>
              Exp
            </button>
            <button style={buttonStyle} onClick={() => append("(")}>
              (
            </button>
            <button style={buttonStyle} onClick={() => append(")")}>
              )
            </button>
            <button
              style={{ ...buttonStyle, background: "#ffb366" }}
              onClick={backspace}
            >
              &larr;
            </button>
            <button style={{ ...buttonStyle, background: "#ff6666" }} onClick={clearAll}>
              C
            </button>

            {/* Row 2 */}
            <button style={buttonStyle} onClick={() => append("sin(")}>
              sin
            </button>
            <button style={buttonStyle} onClick={() => append("cos(")}>
              cos
            </button>
            <button style={buttonStyle} onClick={() => append("tan(")}>
              tan
            </button>
            <button style={buttonStyle} onClick={() => append("log(")}>
              log
            </button>
            <button style={buttonStyle} onClick={() => append("ln(")}>
              ln
            </button>
            <button style={buttonStyle} onClick={() => append("sqrt(")}>
              √
            </button>
            <button style={buttonStyle} onClick={() => append("^2")}>
              x²
            </button>
            <button style={buttonStyle} onClick={() => append("1/(")}>
              1/x
            </button>

            {/* Row 3 */}
            <button style={buttonStyle} onClick={() => append("7")}>
              7
            </button>
            <button style={buttonStyle} onClick={() => append("8")}>
              8
            </button>
            <button style={buttonStyle} onClick={() => append("9")}>
              9
            </button>
            <button style={buttonStyle} onClick={() => append("/")}>
              ÷
            </button>
            <button style={buttonStyle} onClick={() => append("pi")}>
              π
            </button>
            <button style={buttonStyle} onClick={() => append("e")}>
              e
            </button>
            <button style={buttonStyle} onClick={() => append("n!")}>
              n!
            </button>
            <button style={buttonStyle} onClick={() => append("^")}>
              x^y
            </button>

            {/* Row 4 */}
            <button style={buttonStyle} onClick={() => append("4")}>
              4
            </button>
            <button style={buttonStyle} onClick={() => append("5")}>
              5
            </button>
            <button style={buttonStyle} onClick={() => append("6")}>
              6
            </button>
            <button style={buttonStyle} onClick={() => append("*")}>
              ×
            </button>
            <button style={buttonStyle} onClick={() => append("sinh^-1(")}>
              sinh⁻¹
            </button>
            <button style={buttonStyle} onClick={() => append("cosh^-1(")}>
              cosh⁻¹
            </button>
            <button style={buttonStyle} onClick={() => append("tanh^-1(")}>
              tanh⁻¹
            </button>
            <button style={buttonStyle} onClick={() => append("%")}>
              %
            </button>

            {/* Row 5 */}
            <button style={buttonStyle} onClick={() => append("1")}>
              1
            </button>
            <button style={buttonStyle} onClick={() => append("2")}>
              2
            </button>
            <button style={buttonStyle} onClick={() => append("3")}>
              3
            </button>
            <button style={buttonStyle} onClick={() => append("-")}>
              −
            </button>
            <button style={buttonStyle} onClick={() => append("+/-")}>
              ±
            </button>
            <button style={buttonStyle} onClick={() => append("asin(")}>
              sin⁻¹
            </button>
            <button style={buttonStyle} onClick={() => append("acos(")}>
              cos⁻¹
            </button>
            <button style={buttonStyle} onClick={() => append("atan(")}>
              tan⁻¹
            </button>

            {/* Row 6 */}
            <button style={buttonStyle} onClick={() => append("0")}>
              0
            </button>
            <button style={buttonStyle} onClick={() => append(".")}>
              .
            </button>
            <button style={buttonStyle} onClick={() => append("00")}>
              00
            </button>
            <button style={buttonStyle} onClick={() => append("+")}>
              +
            </button>
            <button
              style={{
                ...buttonStyle,
                gridColumn: "span 3",
                background: "#ff6666",
              }}
              onClick={clearAll}
            >
              CE
            </button>
            <button
              style={{
                ...buttonStyle,
                background: "#66cc66",
                gridColumn: "span 2",
              }}
              onClick={evaluateExpression}
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// A base style for most buttons
const buttonStyle = {
  width: "100%",
  height: "40px",
  fontSize: "0.9rem",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
  borderRadius: "3px",
};
