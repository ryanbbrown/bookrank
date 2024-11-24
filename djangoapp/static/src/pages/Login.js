import React, { useState } from 'react';
import axiosInstance from '.././axiosConfig';

const Login = ({ handleLoginSuccess, toggleLoginModal }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup

    const handleLogin = (event) => {
        event.preventDefault();
        axiosInstance.post('api/login/', { username, password })
            .then(response => {
                // console.log(props)
                handleLoginSuccess();
                toggleLoginModal();
                localStorage.setItem('token', response.data.token);
                setMessage('You are now logged in!');
            })
            .catch(error => {
                console.log(error)
                setMessage('Invalid username or password');
            });
    };

    const handleSignup = (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }
        axiosInstance.post('api/signup/', { username, password, password_confirm: confirmPassword })
            .then(response => {
                handleLoginSuccess();
                toggleLoginModal();
                localStorage.setItem('token', response.data.token);
                setMessage('You are now signed up and logged in!');
            })
            .catch(error => {
                setMessage('Signup failed. Please try again.');
            });
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setMessage('');
    };

    return (
        <div>
            <div className="flex flex-col gap-4 w-3/4 mx-auto p-4 pt-6 md:p-6 md:pt-12 bg-white rounded">
                <form
                    onSubmit={isLogin ? handleLogin : handleSignup}
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