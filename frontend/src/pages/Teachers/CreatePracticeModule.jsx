/* eslint-disable react/prop-types */
import React, { Component } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/Teachers/practiceModule.css";

class CreatePracticeModuleContent extends Component {
  constructor(props) {
    super(props);
    const { state } = props.location; // concept passed by navigation
    this.state = {
      step: 1,
      concept: state?.concept || "",
      title: "",
      description: ""
    };
  }

  save = () => {
    // TODO: send to API / Mongo
    console.log("Saving module:", this.state);
    this.props.navigate(-1);
  };

  render() {
    const { step, concept } = this.state;
    return (
      <div className="create-module-wrapper">
        <header>
          <button onClick={() => this.props.navigate(-1)}>&larr;</button>
          <div>
            <h1>Create Practice Module</h1>
            {concept && <p className="subtitle">Concept: {concept}</p>}
          </div>
        </header>

        {step === 1 && (
          <section className="card">
            <h2>Basic Information</h2>
            <input
              placeholder="Module Title"
              value={this.state.title}
              onChange={e => this.setState({ title: e.target.value })}
            />
            <textarea
              placeholder="Description"
              rows={3}
              value={this.state.description}
              onChange={e => this.setState({ description: e.target.value })}
            />
            <footer className="form-footer">
              <button onClick={() => this.setState({ step: 2 })}>Next</button>
            </footer>
          </section>
        )}

        {step === 2 && (
          <section className="card">
            <h2>Question Details</h2>
            <p>Add questions here … (form omitted for brevity)</p>
            <footer className="form-footer">
              <button onClick={() => this.setState({ step: 1 })}>Prev</button>
              <button className="btn-green" onClick={this.save}>
                Save Details
              </button>
            </footer>
          </section>
        )}
      </div>
    );
  }
}

const CreatePracticeModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <CreatePracticeModuleContent navigate={navigate} location={location} />
  );
};

export default CreatePracticeModule;
