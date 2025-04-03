import React, { useState } from 'react';
import '../css/login.css';
// import waveImage from '../assets/images/wave.png';
// import logoImage from '../assets/images/LITEREXIA.png';

const Login = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      userType: 'parent' // default value
    });
    
    const [isLoading, setIsLoading] = useState(false); // Added isLoading state
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true); // Set isLoading to true when starting to submit the form

      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user data
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));

          // Redirect based on user type
          switch(formData.userType) {
            case 'admin':
              window.location.href = '/admin-dashboard';
              break;
            case 'teacher':
              window.location.href = '/teacher-dashboard';
              break;
            case 'parent':
              window.location.href = '/parent-dashboard';
              break;
            default:
              window.location.href = '/';
          }
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
      } finally {
        setIsLoading(false); // Set isLoading to false once the request is done
      }
    };
    

    const handleExit = () => {
      // Logic for exiting the page, for example:
      window.close();  // This will attempt to close the window
      // Or you can redirect the user to another page using:
      // window.location.href = '/'; // Redirect to homepage
    };

    return (
      <div className="login-container">
         <button className="exit-button" onClick={handleExit}>X</button>  {/* Exit button */}
      <div className="login-card">
        <h1 className="welcome-text">Maligayang Pag Balik!</h1>
        <p className="instruction-text">Ilagay ang lyong email at password</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="form-input"
            />
          </div>

          {/* Button changes based on loading state */}
          <button 
            type="submit" 
            className="signin-button" 
            disabled={isLoading} // Disable button when loading
          >
            {isLoading ? 'Logging in...' : 'Sign in'} {/* Display different text based on loading state */}
          </button>
        </form>

        <p className="register-text">
          Wala pang Account? <a href="/register" className="register-link">Mag rehistro</a>
        </p>
        {/* <img src={waveImage} alt="Login Illustration" className="login-image" /> */}
      </div>
    </div>
  );
};

export default Login;