import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';
import { ApiResponse, LoginResponseData } from '../types/types';
import axios from 'axios';

interface LoginProps {
  handleLoginSuccess: () => void;
  toggleLoginModal: () => void;
}

function Login({ handleLoginSuccess, toggleLoginModal }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponseData>>('api/login/', { 
        username, 
        password 
      });
      
      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        handleLoginSuccess();
        toggleLoginModal();
      } else {
        setMessage('Login failed - no token received');
      }
    } catch (error) {
      if (axios.isAxiosError<ApiResponse<never>>(error)) {
        setMessage(error.response?.data?.message || error.response?.data?.error || 'Invalid username or password');
      } else {
        setMessage('An unexpected error occurred');
      }
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await axiosInstance.post<ApiResponse<LoginResponseData>>('api/signup/', {
        username,
        password,
        password_confirm: confirmPassword
      });

      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        handleLoginSuccess();
        toggleLoginModal();
        setMessage('You are now signed up and logged in!');
      } else {
        setMessage('Signup successful but no token received');
      }
    } catch (error) {
      if (axios.isAxiosError<ApiResponse<never>>(error)) {
        setMessage(error.response?.data?.message || error.response?.data?.error || 'Signup failed. Please try again.');
      } else {
        setMessage('An unexpected error occurred');
      }
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage('');
  };

  return (
    <div>
      <div className="flex flex-col gap-4 w-3/4 mx-auto p-4 pt-6 md:p-6 md:pt-12 bg-white rounded">
        <form onSubmit={isLogin ? handleLogin : handleSignup}>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full p-2 pl-10 text-sm text-gray-700"
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full p-2 pl-10 text-sm text-gray-700"
            placeholder="Password"
          />
          {!isLogin && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full p-2 pl-10 text-sm text-gray-700"
              placeholder="Confirm Password"
            />
          )}
          <button
            type="submit"
            className="w-full p-2 text-sm text-white bg-black rounded"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 w-full text-center">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={toggleForm}
                className="text-blue-500 hover:underline focus:outline-none"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={toggleForm}
                className="text-blue-500 hover:underline focus:outline-none"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
      <p>{message}</p>
    </div>
  );
}

export default Login; 