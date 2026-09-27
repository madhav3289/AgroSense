import React, { useState } from 'react';
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from 'react-router-dom';
import PasswordGenerator from '../components/PasswordGenerator';
import { checkPasswordStrength } from '../utils/passwordGenerator';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (error) clearError();
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
    
    // Check password strength when password changes
    if (name === 'password' && value) {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    } else if (name === 'password' && !value) {
      setPasswordStrength(null);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (passwordStrength && passwordStrength.strength === 'weak') {
      errors.password = 'Password is too weak. Please use a stronger password.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordGenerated = (password) => {
    setFormData(prev => ({
      ...prev,
      password: password
    }));
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
    // Clear any existing password validation errors
    if (validationErrors.password) {
      setValidationErrors(prev => ({
        ...prev,
        password: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    const result = await register(formData.username, formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 px-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-green-800">🌱 AgroSense</h1>
          <p className="text-xs text-gray-600 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
            <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Choose a username"
            />
            {validationErrors.username && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.username}</p>
            )}
            </div>

            <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
            )}
            </div>

            <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Create a password"
            />
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
            )}
            
            {/* Password Strength Indicator */}
            {passwordStrength && formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600">Password Strength:</span>
                  <span className={`font-medium text-${passwordStrength.color}-600`}>
                    {passwordStrength.strength.toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      passwordStrength.color === 'green' ? 'bg-green-500' :
                      passwordStrength.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 8) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-gray-500">
                  Score: {passwordStrength.score}/8
                </div>
              </div>
            )}
            
            {/* Password Generator */}
            <PasswordGenerator onPasswordGenerated={handlePasswordGenerated} />
            </div>

            <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
            )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
