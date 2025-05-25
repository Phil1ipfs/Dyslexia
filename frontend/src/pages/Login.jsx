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

  // Helper to determine user type from role string
  const determineUserTypeFromString = (role) => {
    if (!role) return null;
    
    const normalizedRole = role.toLowerCase();
    
    if (normalizedRole === 'admin') return 'admin';
    if (normalizedRole === 'parent' || normalizedRole === 'magulang') return 'parent';
    if (normalizedRole === 'teacher' || normalizedRole === 'guro') return 'teacher';
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      return setError('Email and password are required.');
    }

    setIsLoading(true);

    try {
      /* ----------  API URL  ---------- */
      const BASE =
        import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.DEV ? 'http://localhost:5001' : '');

      console.log(`Attempting login to ${BASE}/api/auth/login`);

      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      // Parse response first to get detailed error if available
      const data = await res.json();

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
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Determine user type based on roles from server response
      let userType = null;
      
      // Try to find a valid role in the roles array
      if (Array.isArray(data.user.roles)) {
        for (const role of data.user.roles) {
          const type = determineUserTypeFromString(role);
          if (type) {
            userType = type;
            break;
          }
        }
      } else if (typeof data.user.roles === 'string') {
        userType = determineUserTypeFromString(data.user.roles);
      }
      
      // If no valid role was found
      if (!userType) {
        console.warn('Could not determine user type from roles:', data.user.roles);
        
        // Try to resolve role ID if it looks like an ObjectId
        const roleId = Array.isArray(data.user.roles) && data.user.roles.length > 0 
          ? data.user.roles[0] 
          : data.user.roles;
        
        if (roleId) {
          try {
            // Try to fetch the role details
            const roleResponse = await fetch(`${BASE}/api/auth/check-role/${roleId}`);
            if (roleResponse.ok) {
              const roleData = await roleResponse.json();
              userType = determineUserTypeFromString(roleData.roleName);
              console.log('Role resolved from ID:', roleData);
            }
          } catch (roleError) {
            console.error('Error resolving role ID:', roleError);
          }
        }
        
        // If still no user type, use a fallback based on what the user selected
        if (!userType) {
          userType = expectedRoleType || 'teacher';
          console.warn(`Using fallback user type: ${userType}`);
        }
      }
      
      console.log('Determined user type:', userType);
      
      // Store the detected user type
      localStorage.setItem('userType', userType);

      // Check if user type matches expected type from account selection
      if (expectedRoleType && userType !== expectedRoleType) {
        console.warn(`Role mismatch: Expected ${expectedRoleType}, got ${userType}`);
        setError(`This account is a ${userType} account, not a ${expectedRoleType} account. Please choose the correct account type.`);
        setIsLoading(false);
        return;
      }

      // Call the onLogin function to update App state
      onLogin();

      // Route to the appropriate dashboard
      if (userType === 'admin') {
        navigate('/admin/dashboard');
      } else if (userType === 'parent') {
        navigate('/parent/dashboard');
      } else {
        // For teachers, initialize profile first
        try {
          const teacherService = await import('../services/Teachers/teacherService');
          await teacherService.initializeTeacherProfile();
        } catch (profileError) {
          console.warn('Failed to initialize teacher profile:', profileError);
        }

        navigate('/teacher/dashboard');
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