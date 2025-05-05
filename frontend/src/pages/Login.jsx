import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

import logo from '../assets/images/Teachers/LITEREXIA.png';
import wave from '../assets/images/Teachers/wave.png';
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
    // For testing purposes, make this always return true to bypass validation
    return true;
    
    // Uncomment this proper regex once login is working
    // const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    // return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    // Basic client‑side checks
    if (!formData.email || !formData.password) {
      return setError('Lahat ng field ay kailangan punan.');
    }
  
    setIsLoading(true);
    
    try {
      /* ----------  API URL  ---------- */
      // VITE_API_BASE_URL is optional; fallback to localhost:5002 in dev
      const BASE =
        import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:5002' : '');
  
      console.log(`Attempting login to ${BASE}/api/auth/login`);
      
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include', // keep if you later use cookies
      });
  
      if (!res.ok) {
        // Try to read server message
        const { message } = await res.json().catch(() => ({}));
        throw new Error(message || `HTTP ${res.status}`);
      }
  
      // Handle successful login
      const { token, user } = await res.json();
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      console.log('Login successful, user data:', user);
      
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      
      // Call the onLogin function from props to update App state
      onLogin();
  
      /* ----------  Role‑based redirection  ---------- */
      // roles can be string OR array; normalize to array
      const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
      console.log('User roles:', roles);
      
      // Set userType based on roles
      if (roles.includes('parent') || roles.includes('magulang')) {
        localStorage.setItem('userType', 'parent');
        navigate('/parent/dashboard');
      }
      
      
      else if (roles.includes('teacher') || roles.includes('guro')) {
        localStorage.setItem('userType', 'teacher');
        try {
          const teacherService = await import('../services/teacherService');
          await teacherService.initializeTeacherProfile();
        } catch (error) {
          console.warn('Failed to initialize teacher profile:', error);
        }
        
        navigate('/teacher/dashboard');


        
      } else if (roles.includes('admin')) {
        localStorage.setItem('userType', 'admin');
        navigate('/admin/dashboard');
      } else {
        // If no recognized role, default to user
        localStorage.setItem('userType', 'user');
        navigate('/'); // fallback
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'May nangyaring mali. Subukan muli.');
    } finally {
      setIsLoading(false);
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