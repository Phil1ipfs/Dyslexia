// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

import logo from '../assets/images/LITEREXIA.png';
import wave from '../assets/images/wave.png';
import { FiMail, FiEye, FiEyeOff } from 'react-icons/fi';

function ErrorDialog({ message, onClose }) {
  return (
    <div className="error-dialog-overlay fade-in">
      <div className="error-dialog-box pop-in">
        <p>{message}</p>
        <button className="dialog-close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isValidPassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      return setError('Lahat ng field ay kailangan punan.');
    }
    if (!formData.email.includes('@')) {
      return setError('Gumamit ng wastong email address.');
    }
    if (!isValidPassword(formData.password)) {
      return setError('Password must be 8+ characters, contain 1 uppercase & 1 number.');
    }

    setIsLoading(true);
    try {
      const response = await mockLogin(formData);
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        if (onLogin) onLogin();

        // Read the user type from localStorage (set previously via ChooseAccountType)
        // Default to 'teacher' if not found.
        const userType = localStorage.getItem('userType') || 'teacher';
        // Redirect to the appropriate dashboard based on user type.
        navigate(`/${userType}/dashboard`);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch {
      setError('May nangyaring mali. Subukan muli.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated login function.
  const mockLogin = ({ email, password }) => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (email && password) {
          resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                token: 'mock-token',
                user: { email }
              })
          });
        } else {
          resolve({
            ok: false,
            json: () => Promise.resolve({ message: 'Invalid credentials' })
          });
        }
      }, 700);
    });
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Literexia Logo" className="top-left-logo" />
      {/* Exit button to return to Choose Account page */}
      <button className="exit-button" onClick={() => navigate('/choose-account')}>X</button>

      {error && <ErrorDialog message={error} onClose={() => setError('')} />}

      <div className="login-card">
        <h1 className="welcome-text">Maligayang Pagbalik!</h1>
        <p className="instruction-text">Punan ang email at password</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group icon-input">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
            />
            <FiMail className="input-icon" />
          </div>

          <div className="form-group icon-input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
            {showPassword ? (
              <FiEyeOff
                className="input-icon clickable"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <FiEye
                className="input-icon clickable"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          <button
            className="signin-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <img src={wave} alt="Wave" className="bottom-wave" />
    </div>
  );
};

export default Login;
