import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

import logo from '../assets/images/Teachers/LITEREXIA.png';
import wave from '../assets/images/Teachers/wave.png';
import { FiMail, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

function ErrorDialog({ message, onClose }) {
  return (
    <div className="error-dialog-overlay fade-in">
      <div className="error-dialog-box pop-in">
        <div className="error-icon">
          <FiAlertCircle size={24} color="#d9534f" />
        </div>
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
  const [expectedRoleType, setExpectedRoleType] = useState(null);

  // Retrieve the expected role type from localStorage when component mounts
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType) {
      setExpectedRoleType(userType);
      console.log('Expected user type:', userType);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        setError('Email and password are required.');
        setIsLoading(false);
        return;
      }

      if (!expectedRoleType) {
        setError('User type not specified. Please return to account selection.');
        setIsLoading(false);
        return;
      }

      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
      console.log('Login attempt:', {
        email: formData.email,
        expectedRole: expectedRoleType,
        url: `${BASE}/api/auth/login`
      });

      // Add the expected role to the login request
      const loginData = {
        email: formData.email,
        password: formData.password,
        expectedRole: expectedRoleType
      };

      console.log('Sending login request with data:', {
        email: loginData.email,
        expectedRole: loginData.expectedRole
      });

      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      // Parse response first to get detailed error if available
      const data = await res.json();
      console.log('Login response:', {
        status: res.status,
        data: data
      });

      // If response is not OK, handle the error
      if (!res.ok) {
        throw new Error(data.message || `Login failed (${res.status})`);
      }

      // Check if response has expected data
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      console.log('Login successful, user data:', data.user);

      // Store auth data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userType', expectedRoleType);

      // Call the onLogin function to update App state
      onLogin();

      // Route based on user type
      if (expectedRoleType === 'parent') {
        navigate('/parent/dashboard');
      } else if (expectedRoleType === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (expectedRoleType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid account type selected');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get label for the current account type
  const getAccountTypeLabel = () => {
    switch (expectedRoleType) {
      case 'parent': return 'Magulang';
      case 'teacher': return 'Guro';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Literexia Logo" className="top-left-logo" />
      {/* Exit button to return to Choose Account page */}
      <button className="exit-button" onClick={() => navigate('/choose-account')}>X</button>

      {error && <ErrorDialog message={error} onClose={() => setError('')} />}

      <div className="login-card">
        <h1 className="welcome-text">Maligayang Pagbalik!</h1>
        <p className="instruction-text">
          Punan ang email at password para sa {getAccountTypeLabel()} account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group icon-input">
            <input
              type="email"
              name="email"
              placeholder="Email" required
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              data-testid="email-input"
            />
            <FiMail className="input-icon" />
          </div>

          <div className="form-group icon-input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password" required
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              data-testid="password-input"
            />
            {showPassword ? (
              <FiEyeOff
                className="input-icon clickable"
                onClick={() => setShowPassword(false)}
                data-testid="hide-password"
              />
            ) : (
              <FiEye
                className="input-icon clickable"
                onClick={() => setShowPassword(true)}
                data-testid="show-password"
              />
            )}
          </div>

          <button
            className="signin-button"
            type="submit"
            disabled={
              isLoading ||
              formData.email.trim() === '' ||
              formData.password === ''
            }
            data-testid="login-button"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <img src={wave} alt="Wave" className="bottom-wave" />
    </div>
  );
};

export default Login;