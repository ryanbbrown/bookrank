import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "./ui/button";
import { Search as SearchIcon, Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface HeaderProps {
    isLoggedIn: boolean;
    handleLogout: () => void;
    toggleLoginModal: () => void;
}

export function Header({ isLoggedIn, handleLogout, toggleLoginModal }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();

    const handleLogoutClick = () => {
        handleLogout();
        queryClient.removeQueries();
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
        <header className="flex justify-between items-center py-4 px-2 sm:p-6">
            <Link to={isLoggedIn ? "/dashboard" : "/"} className="pl-1 sm:pl-0">
                <div className="flex items-center space-x-1">
                    <img src="/books.png" alt="Logo" className="w-8 m-1 mr-2" />
                    <div className={`text-2xl font-bold ${location.pathname === "/" ? "block sm:block" : "hidden sm:block"}`}>BookRank</div>
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
                <div className="flex items-center gap-4 justify-end flex-1 min-w-0">
                    <form onSubmit={handleSearch} className="flex min-w-0">
                        <div className="relative min-w-0">
                            <input
                                type="text"
                                placeholder="Search books"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-40 sm:w-72 px-4 py-2 pr-10 rounded-lg border shadow-md outline-none text-sm block sm:hidden"
                                data-placeholder-mobile="Search for a book"
                            />
                            <input
                                type="text"
                                placeholder="Search for a book title or author"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-40 sm:w-72 px-4 py-2 pr-10 rounded-lg border shadow-md outline-none text-sm hidden sm:block"
                                data-placeholder-mobile="Search for a book"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-70"
                            >
                                <SearchIcon className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                    </form>

                    <Link to="/myrecs" className="hover:opacity-80">
                        <span className="block sm:hidden px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">Recs</span>
                        <span className="hidden sm:block px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">Recommendations</span>
                    </Link>

                    <nav className="flex items-center pr-1 sm:pr-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard" className="w-full">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/mybooks/read" className="w-full">My Library</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/mybooks/to_be_read" className="w-full">To Be Read</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/mybooks/currently_reading" className="w-full">Currently Reading</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/goodreadsimport" className="w-full">Import</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            )}
        </header>
    );
} 