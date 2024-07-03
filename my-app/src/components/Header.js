import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ isLoggedIn, handleLogout }) => {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        handleLogout();
        navigate('/');
    };

    const location = useLocation();
    const isHomepage = location.pathname === '/homepage';

    if (isHomepage) {
        return null;
    }

    return (
        <header className="flex justify-between items-center p-4 bg-black text-white">
            <img src="books.png" className="w-8 m-1 mr-2"></img>
            <div className="text-2xl font-bold">Genres.fyi</div>
            {isLoggedIn && (
                <nav className="flex justify-center flex-grow">
                    <Link to="/search" className="mx-4 hover:text-gray-400">Search</Link>
                    <Link to="/mybooks" className="mx-4 hover:text-gray-400">My Books</Link>
                    <Link to="/toberead" className="mx-4 hover:text-gray-400">TBR</Link>
                    <Link to="/myrecs" className="mx-4 hover:text-gray-400">Recommendations</Link>
                    <Link to="/mychat" className="mx-4 hover:text-gray-400">Chat</Link>
                    <Link to="/goodreadsimport" className="mx-4 hover:text-gray-400">Import</Link>
                </nav>
            )}
            {isLoggedIn && (
                <button onClick={handleLogoutClick} className="hover:text-gray-400">Logout</button>
            )}
        </header>
    );
};

export default Header;
