import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
    toggleLoginModal: () => void;
}

export function Header({ isLoggedIn, handleLogout, toggleLoginModal }: HeaderProps) {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        handleLogout();
        navigate('/');
    };

    return (
        <header className="flex justify-between items-center p-6">
            <Link to="/">
                <div className="flex items-center space-x-1">
                    <img src="/books.png" alt="Logo" className="w-8 m-1 mr-2" />
                    <div className="text-2xl font-bold">BookRank</div>
                </div>
            </Link>

            {!isLoggedIn ? (
                <div className="flex gap-4">
                    <Button
                        onClick={toggleLoginModal}
                        variant="outline"
                        className="px-6 rounded-lg hidden sm:block"
                    >
                        Login
                    </Button>
                    <Button
                        onClick={toggleLoginModal}
                        variant="outline"
                        className="px-6 bg-homepage-blue text-white hover:bg-indigo-500 rounded-lg"
                    >
                        Sign up
                    </Button>
                </div>
            ) : (
                <div className="flex items-center">
                    <nav className="hidden md:flex justify-center flex-grow mr-8">
                        <Link to="/search" className="mx-4 hover:text-gray-400">Search</Link>
                        <Link to="/mybooks/read" className="mx-4 hover:text-gray-400">My Books</Link>
                        <Link to="/mybooks/to_be_read" className="mx-4 hover:text-gray-400">TBR</Link>
                        <Link to="/mybooks/currently_reading" className="mx-4 hover:text-gray-400">Currently Reading</Link>
                        <Link to="/myrecs" className="mx-4 hover:text-gray-400">Recommendations</Link>
                        <Link to="/goodreadsimport" className="mx-4 hover:text-gray-400">Import</Link>
                    </nav>
                    <Button
                        onClick={handleLogoutClick}
                        variant="outline"
                        className="px-6"
                    >
                        Logout
                    </Button>
                </div>
            )}
        </header>
    );
} 