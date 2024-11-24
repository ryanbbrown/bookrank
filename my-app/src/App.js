import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './tailwind.css';
import Login from './pages/Login';
import Search from './pages/Search';
import MyBooks from './pages/MyBooks';
import { Header } from './components/Header.tsx';
import ToBeRead from './pages/ToBeRead';
import Recommendations from './pages/Recommendations';
import Chat from './pages/Chat';
import GoodreadsImport from './pages/GoodreadsImport';
import { Footer } from './components/Footer.tsx';
import TermsOfService from './pages/TermsOfService';
import Homepage from './pages/Homepage';
import axiosInstance from './axiosConfig';
const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        const savedLoginState = sessionStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(savedLoginState);
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
        setShowLoginModal(false);
    }

    const handleLogout = () => {
        axiosInstance.post('/api/logout/').then(() => {
            setIsLoggedIn(false);
            sessionStorage.removeItem('isLoggedIn');
        });
    };

    const toggleLoginModal = () => {
        setShowLoginModal(!showLoginModal);
    };

    return (
        <BrowserRouter>
            <div className="bg-white text-black min-h-screen flex flex-col">
                <Header 
                    isLoggedIn={isLoggedIn} 
                    handleLogout={handleLogout}
                    toggleLoginModal={toggleLoginModal}
                />
                <main className="flex-grow">
                    <Routes>
                        <Route 
                            path="/" 
                            element={
                                <Homepage 
                                    handleLoginSuccess={handleLoginSuccess}
                                    isLoggedIn={isLoggedIn}
                                    showLoginModal={showLoginModal}
                                    toggleLoginModal={toggleLoginModal}
                                />
                            } 
                        />
                        <Route path="/login" exact element={<Login handleLoginSuccess={handleLoginSuccess} />} />
                        <Route path="/homepage" exact element={<Homepage handleLoginSuccess={handleLoginSuccess} isLoggedIn={isLoggedIn} />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/mybooks" element={<MyBooks />} />
                        <Route path="/toberead" element={<ToBeRead />} />
                        <Route path="/myrecs" element={<Recommendations />} />
                        <Route path="/mychat" element={<Chat />} />
                        <Route path="/goodreadsimport" element={<GoodreadsImport />} />
                        <Route path="/termsofservice" element={<TermsOfService />} />
                    </Routes>
                </main>
                {showLoginModal && !isLoggedIn && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div className="relative bg-white rounded-lg p-6 sm:w-3/4 md:w-2/3 l:w-1/3 xl:w-1/3 shadow-md">
                            <button
                                className="absolute top-2 right-2 w-8 h-8 text-black rounded flex items-center justify-center"
                                onClick={toggleLoginModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                            <Login
                                handleLoginSuccess={handleLoginSuccess}
                                toggleLoginModal={toggleLoginModal}
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full mx-auto">
                <Footer />
            </div>
        </BrowserRouter>
    );
}

export default App;