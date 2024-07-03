import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './axiosConfig'
import './tailwind.css';
import Login from './pages/Login';
import Search from './pages/Search';
import MyBooks from './pages/MyBooks';
import Header from './components/Header';
import ToBeRead from './pages/ToBeRead';
import Recommendations from './pages/Recommendations';
import Chat from './pages/Chat';
import GoodreadsImport from './pages/GoodreadsImport';
import Footer from './components/Footer';
import TermsOfService from './pages/TermsOfService';
import Homepage from './pages/Homepage';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // this sessionStorage method of storing whether logged in is not super robust/secure
    useEffect(() => {
        // Retrieve the login state from sessionStorage
        const savedLoginState = sessionStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(savedLoginState);
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
    };
    const handleLogout = () => {
        setIsLoggedIn(false);
        sessionStorage.removeItem('isLoggedIn');
    };

    return (
        <BrowserRouter>
            <div className="bg-white text-black min-h-screen flex flex-col">
                <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" exact element={isLoggedIn ? <Search /> : <Login onLoginSuccess={handleLoginSuccess} />} />
                        <Route path="/homepage" element={<Homepage />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/mybooks" element={<MyBooks />} />
                        <Route path="/toberead" element={<ToBeRead />} />
                        <Route path="/myrecs" element={<Recommendations />} />
                        <Route path="/mychat" element={<Chat />} />
                        <Route path="/goodreadsimport" element={<GoodreadsImport />} />
                        <Route path="/termsofservice" element={<TermsOfService />} />
                    </Routes>
                </main>
            </div>
            <div><Footer /></div>
        </BrowserRouter>
    );
}

export default App;