import React from 'react';

const Homepage = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to Dyslexia Learn</h1>
      <p style={styles.subtitle}>
        Empowering young learners with personalized reading support.
      </p>
      <button style={styles.button} onClick={() => alert('Let’s get started!')}>
        Get Started
      </button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '100px 20px',
    fontFamily: 'Arial, sans-serif',
    background: '#f5f7fa',
    height: '100vh',
  },
  title: {
    fontSize: '3rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginTop: '10px',
  },
  button: {
    marginTop: '30px',
    padding: '10px 20px',
    fontSize: '1rem',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default Homepage;
