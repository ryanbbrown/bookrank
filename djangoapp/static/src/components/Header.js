import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = ({ isLoggedIn, isApp, handleLogout, toggleLoginModal }) => {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        handleLogout();
        navigate('/');
    };

    const location = useLocation();
    const isHomepage = location.pathname === '/homepage' | location.pathname === '/';

    // if it's the header in App.js and you're routed to /homepage, don't show anything
    // we do this because there is a slightly modified header in Homepage.js
    if (isHomepage && isApp) {
        return (null);
    }

    // this is the header you return if you're on homepage
    else if (isHomepage) {
        return (
            <header className="flex relative justify-between items-center p-4 bg-white text-black">
                <Link to="/">
                <div className="flex items-center space-x-1" href="/">
                    <img src="books.png" className="w-8 m-1 mr-2" href="/"></img>
                    <div className="text-2xl font-bold">Genres.fyi</div>
                    </div>
                </Link>

                {isLoggedIn === false && (
                    <div className="flex items-center">
                        <nav className="hidden md:block flex justify-center flex-grow absolute left-1/2 transform -translate-x-1/2">
                            <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Search</button>
                            <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Recommendations</button>
                            <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Chat</button>
                            <button onClick={toggleLoginModal} className="mx-4 hover:text-gray-400">Import</button>
                        </nav>
                        <button onClick={toggleLoginModal} className="bg-black text-white rounded-md px-4 py-2">
                            Login
                        </button>
                    </div>

                )}

                {isLoggedIn && (
                    <div className="flex items-center">
                        <nav className="flex justify-center flex-grow absolute left-1/2 transform -translate-x-1/2">
                            <Link to="/search" className="mx-4 hover:text-gray-400">Search</Link>
                            <Link to="/mybooks" className="mx-4 hover:text-gray-400">My Books</Link>
                            <Link to="/toberead" className="mx-4 hover:text-gray-400">TBR</Link>
                            <Link to="/myrecs" className="mx-4 hover:text-gray-400">Recommendations</Link>
                            <Link to="/mychat" className="mx-4 hover:text-gray-400">Chat</Link>
                            <Link to="/goodreadsimport" className="mx-4 hover:text-gray-400">Import</Link>
                        </nav>
                        <button onClick={handleLogoutClick} className="hover:text-gray-400 bg-black text-white rounded-md px-4 py-2">Logout</button>
                    </div>
                )}
                {/* <button onClick={toggleLoginModal} className="bg-black text-white rounded-md px-4 py-2">
                    Login
                </button> */}
            </header>
        )
    }

    else {
        return (
            <>
                {isLoggedIn && (
                    <header className="flex relative justify-between items-center p-4 bg-white text-black border-b border-gray-200">
                        <Link to="/">
                        <div className="flex items-center space-x-1">
                            <img src="books.png" className="w-8 m-1 mr-2"></img>
                            <div className="text-2xl font-bold">Genres.fyi</div>
                            </div>
                            </Link>

                        <nav className="flex justify-center flex-grow absolute left-1/2 transform -translate-x-1/2">
                            <Link to="/search" className="mx-4 hover:text-gray-400">Search</Link>
                            <Link to="/mybooks" className="mx-4 hover:text-gray-400">My Books</Link>
                            <Link to="/toberead" className="mx-4 hover:text-gray-400">TBR</Link>
                            <Link to="/myrecs" className="mx-4 hover:text-gray-400">Recommendations</Link>
                            <Link to="/mychat" className="mx-4 hover:text-gray-400">Chat</Link>
                            <Link to="/goodreadsimport" className="mx-4 hover:text-gray-400">Import</Link>
                        </nav>
                        <button onClick={handleLogoutClick} className="hover:text-gray-400 bg-black text-white rounded-md px-4 py-2">Logout</button>
                    </header>
                )}
            </>
        );
    }
};

export default Header;


{/* <header className="flex justify-between items-center p-4 bg-black text-white">
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
</header> */}
