import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
    toggleLoginModal: () => void;
}

export function Header({ isLoggedIn, handleLogout, toggleLoginModal }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const isHomepage = location.pathname === '/homepage' || location.pathname === '/';

    const handleLogoutClick = () => {
        handleLogout();
        navigate('/');
    };

    return (
        <header className={`flex relative justify-between items-center p-4 bg-white text-black ${!isHomepage ? 'border-b border-gray-200' : ''}`}>
            <Link to="/">
                <div className="flex items-center space-x-1">
                    <img src="books.png" alt="Logo" className="w-8 m-1 mr-2" />
                    <div className="text-2xl font-bold">BookRank</div>
                </div>
            </Link>

            {!isLoggedIn ? (
                <div className="flex items-center">
                    <nav className="hidden md:flex justify-center flex-grow absolute left-1/2 transform -translate-x-1/2">
                        <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Search</button>
                        <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Recommendations</button>
                        <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Chat</button>
                        <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Import</button>
                    </nav>
                    <button onClick={toggleLoginModal} className="bg-black text-white rounded-md px-4 py-2">
                        Login
                    </button>
                </div>
            ) : (
                <div className="flex items-center">
                    <nav className="hidden md:flex justify-center flex-grow absolute left-1/2 transform -translate-x-1/2">
                        <Link to="/search" className="mx-4 hover:text-gray-400">Search</Link>
                        <Link to="/mybooks" className="mx-4 hover:text-gray-400">My Books</Link>
                        <Link to="/toberead" className="mx-4 hover:text-gray-400">TBR</Link>
                        <Link to="/myrecs" className="mx-4 hover:text-gray-400">Recommendations</Link>
                        <Link to="/mychat" className="mx-4 hover:text-gray-400">Chat</Link>
                        <Link to="/goodreadsimport" className="mx-4 hover:text-gray-400">Import</Link>
                    </nav>
                    <button onClick={handleLogoutClick} className="bg-black text-white rounded-md px-4 py-2">
                        Logout
                    </button>
                </div>
            )}
        </header>
    );
} 