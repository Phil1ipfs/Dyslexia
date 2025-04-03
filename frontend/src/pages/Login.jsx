import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

import logo from '../assets/images/LITEREXIA.png';
import wave from '../assets/images/wave.png';

// React Icons (install with: npm install react-icons)
import { FiMail, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'teacher'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle changes in email/password
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Mock login – replace with a real fetch() call to your MongoDB backend later
      const response = await mockLogin(formData);
      const data = await response.json();

      if (response.ok) {
        // Save token/user in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));

        // Notify parent component that we are logged in
        if (onLogin) onLogin();

        // Navigate to dashboard or any route you choose
        navigate('/dashboard');
      } else {
        // Show error from mock or server
        setError(data.message || 'Login failed');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock login function (for demonstration only)
  const mockLogin = ({ email, password, userType }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Very basic check
        if (email && password) {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              token: 'mock-jwt-token',
              user: {
                _id: 'mock-user-id',
                name: email.split('@')[0],
                email,
                userType
              }
            })
          });
        } else {
          resolve({
            ok: false,
            json: () => Promise.resolve({
              message: 'Invalid email or password'
            })
          });
        }
      }, 800);
    });
  };

  return (
    <div className="login-container">
      {/* Literexia logo in top-left */}
      <img src={logo} alt="Literexia Logo" className="top-left-logo" />

      {/* Exit button top-right */}
      <button className="exit-button" onClick={() => navigate("/")}>X</button>

      {/* Main login card */}
      <div className="login-card">
        <h1 className="welcome-text">Maligayang Pag Balik!</h1>
        <p className="instruction-text">ilagay ang iyong email at password</p>

        {/* Error display */}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email field with icon */}
          <div className="form-group icon-input">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
            />
            <FiMail className="input-icon" />
          </div>

          {/* Password field with show/hide icon */}
          <div className="form-group icon-input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
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

          {/* Login button */}
          <button type="submit" className="signin-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Sign in'}
          </button>
        </form>

        {/* Registration link */}
        <p className="register-text">
          Wala pang Account?{' '}
          <a href="/register" className="register-link">Mag rehistro</a>
        </p>
      </div>

      {/* Wave background at bottom */}
      <img src={wave} alt="Wave Background" className="bottom-wave" />
    </div>
  );
};

export default Login;
