import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';
import AuthService from '../services/authService';

import { FiMail, FiEye, FiEyeOff, FiAlertCircle, FiLock } from 'react-icons/fi';

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
        setError('Isagay ang iyong email at password.');
        setIsLoading(false);
        return;
      }

      console.log('Login attempt:', {
        email: formData.email
      });

      // Call login without specifying role type - let backend determine the user type
      const response = await AuthService.login(formData.email, formData.password);

      console.log('Login successful, user data:', response.user);

      // Store user type returned by backend
      if (response.user && response.user.role) {
        localStorage.setItem('userType', response.user.role);
      }

      // Store user ID if available
      if (response.user && response.user.id) {
        localStorage.setItem('userId', response.user.id);
      }

      // Call the onLogin function to update App state
      if (onLogin) {
        onLogin();
      }

      // Route based on user type returned from backend
      const userRole = response.user.role;
      if (userRole === 'parent') {
        navigate('/parent/dashboard');
      } else if (userRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Mali ang tipo ng account.');
      }
    } catch (err) {
      console.error('Login error:', err);

      // Provide user-friendly error messages in Filipino
      if (err.response) {
        if (err.response.status === 403) {
          setError('Hindi ka may access sa sistemang ito.');
        } else if (err.response.status === 401) {
          setError('Mali ang email o password.');
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Nabigo ang pag-login. Subukan ulit mamaya.');
        }
      } else {
        setError(err.message || 'Mali ang email o password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {error && <ErrorDialog message={error} onClose={() => setError('')} />}

      <div className="login-card">
        {/* Exit button to return to Homepage */}
        <button className="exit-button" onClick={() => navigate('/')}>X</button>
        <h1 className="welcome-text">Maligayang Pag Balik!</h1>
        <p className="instruction-text">
          Isagay ang iyong email at password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group icon-input">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
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
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              data-testid="password-input"
            />
            <FiLock className="input-icon" />
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
            {isLoading ? 'Nag-i-sign in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;