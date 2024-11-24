import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from '../axiosConfig';

function Login(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    


  const handleSignup = (event) => {
      event.preventDefault();
    axiosInstance.post('api/signup/', { username, password })
      .then(response => {
          props.onLoginSuccess();
          localStorage.setItem('token', response.data.token);
        setMessage('You are now logged in!');
      })
      .catch(error => {
        setMessage('Invalid username or password');
      });
  };

  return (
    <div>
      <form
        onSubmit={handleSignup}
        className="flex flex-col gap-4 md:w-1/2 xl:w-1/3 mx-auto p-4 pt-6 md:p-6 md:pt-12 bg-white shadow-md rounded"
      >
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
        <button
          type="submit"
          className="w-full p-2 text-sm text-white bg-orange-500 hover:bg-orange-700 rounded"
        >
          Sign Up
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default Login;