import React, { useState } from "react";

const StandardPracticeForm = () => {
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [image, setImage] = useState(null);
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);

  return (
    <div className="practice-form">
      <label>Question:</label>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} />

      <label>Hint:</label>
      <input value={hint} onChange={(e) => setHint(e.target.value)} />

      <label>Upload Image:</label>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />

      <label>Choices:</label>
      {choices.map((choice, idx) => (
        <input
          key={idx}
          value={choice}
          onChange={(e) => {
            const updated = [...choices];
            updated[idx] = e.target.value;
            setChoices(updated);
          }}
          placeholder={`Choice ${idx + 1}`}
        />
      ))}

      <label>Correct Answer:</label>
      <select onChange={(e) => setCorrectIndex(Number(e.target.value))}>
        {choices.map((_, idx) => (
          <option key={idx} value={idx}>
            Choice {idx + 1}
          </option>
        ))}
      </select>

      <button onClick={() => alert("Submit to MongoDB here!")}>Submit</button>
    </div>
  );
};

export default StandardPracticeForm;
