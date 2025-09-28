// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

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
        localStorage.setItem('userType', data.user.userType);
        if (onLogin) onLogin();

        // Redirect to the appropriate dashboard based on determined user type
        navigate(`/${data.user.userType}/dashboard`);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch {
      setError('May nangyaring mali. Subukan muli.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine user type based on email domain or specific patterns
  const determineUserType = (email) => {
    // Example logic - customize based on your requirements
    if (email.includes('admin')) return 'admin';
    if (email.includes('parent')) return 'parent';
    return 'teacher'; // default to teacher
  };

  // Simulated login function.
  const mockLogin = ({ email, password }) => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (email && password) {
          const userType = determineUserType(email);
          resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                token: 'mock-token',
                user: { email, userType }
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
      {error && <ErrorDialog message={error} onClose={() => setError('')} />}

      <div className="login-content">
        {/* Exit button positioned within the modal */}
        <button className="exit-button" onClick={() => navigate('/')}>X</button>

        <h1 className="welcome-text">Maligayang Pag Balik!</h1>
        <p className="instruction-text">Ilagay ang iyong email at password</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
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
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
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
    </div>
  );
};

export default Login;
