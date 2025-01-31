import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from "./ui/button";
import { Search as SearchIcon } from "lucide-react";

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
    toggleLoginModal: () => void;
}

export function Header({ isLoggedIn, handleLogout, toggleLoginModal }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();

    const handleLogoutClick = () => {
        handleLogout();
        navigate('/');
    };

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchInput) return;

        if (location.pathname === '/search') {
            setSearchParams({ q: searchInput });
        } else {
            navigate(`/search?q=${encodeURIComponent(searchInput)}`);
        }
        setSearchInput('');
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
                <div className="flex items-center gap-4">
                    <form onSubmit={handleSearch} className="flex">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for a book title or author"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-72 px-4 py-2 pr-10 rounded-lg border shadow-md outline-none text-sm"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
                            >
                                <SearchIcon className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                    </form>

                    <nav className="hidden md:flex justify-center flex-grow">
                        {/* <Link to="/search" className="mx-4 hover:text-gray-400">Search</Link> */}
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