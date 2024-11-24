import React, { useState } from 'react';
import Login from './Login';
import Header from '../components/Header';

const Homepage = ({ handleLoginSuccess, handleLogout, isLoggedIn }) => {
    const [isLoginVisible, setIsLoginVisible] = useState(false);

    const toggleLoginModal = () => {
        setIsLoginVisible(!isLoginVisible);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header handleLogout={handleLogout} toggleLoginModal={toggleLoginModal} isLoggedIn={isLoggedIn} isApp={false} />

            

            {/* Main Content */}
            <main className="flex sm:flex-1 md:flex-row flex-col md:justify-center items-center px-4 py-8 md:min-h-[90vh]">
                {/* Left Column */}
                <div className="flex flex-col md:w-1/3 w-4/5 mr-5">
                    <h1 className="sm:text-7xl text-4xl font-bold">Discover new reads</h1>
                    <p className="mt-4 sm:text-lg">
                        Expand your library with diverse recommendations powered by AI.
                    </p>
                    <button
                        onClick={toggleLoginModal}
                        className="md:mt-8 mt-4 md:mb-0 mb-5 bg-gray-300 text-black rounded-md px-4 py-2 self-start"
                    >
                        Explore books
                    </button>
                </div>

                {/* Right Column */}
                <div className="relative md:w-2/5 w-4/5 md:mt-0 mt-10 md: ml-5 ml-0">
                    <div className="absolute inset-0 bg-gray-300 transform translate-x-6 -translate-y-6 rounded-md w-full"></div>
                    <img src="homepage2.jpg" alt="Mountain" className="relative rounded-md shadow-md" />
                </div>
            </main>

            <div className="bg-white py-16">
                <h1 className="md:text-5xl text-3xl text-center font-bold mb-10">Why readers choose genres.fyi</h1>
                <div className="container mx-auto md:w-1/2 w-4/5 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="flex flex-col bg-gray-100 rounded-md shadow-md p-6">
                        <img src="compare.png" alt="Compare" className="my-4 w-20" />
                        <h3 className="font-bold text-3xl mb-2">Compare</h3>
                        <p>1-5 stars is limiting, but choosing a more specific rating is hard. Just decide between pairs of books and let our algorithm do the rest.</p>
                    </div>
                    <div className="flex flex-col bg-gray-100 rounded-md shadow-md p-6">
                        <img src="swipe-left.png" alt="Swipe" className="my-4 w-20" />
                        <h3 className="font-bold text-3xl mb-2">Swipe</h3>
                        <p>Receive personalized book recommendations based on the actual content of your favorite books in an easily digestible format.</p>
                    </div>
                    <div className="flex flex-col bg-gray-100 rounded-md shadow-md p-6">
                        <img src="chatbot.png" alt="Chatbot" className="my-4 w-20" />
                        <h3 className="font-bold text-3xl mb-2">Chat</h3>
                        <p>Talk to our chatbot to help you find <i>just</i> the book you're looking for. War in a fairie woodland? Android space romance? We got you.</p>
                    </div>
                    <div className="flex flex-col bg-gray-100 rounded-md shadow-md p-6">
                        <img src="import.png" alt="Import" className="my-4 w-20" />
                        <h3 className="font-bold text-3xl mb-2">Import</h3>
                        <p>Easily import your reading history for a seamless transition. No more frustration with Goodread's clunky interface and generic book recs.</p>
                    </div>
                </div>
            </div>


            <h1 className="md:text-5xl text-3xl text-center font-bold mt-20 mb-10">The numbers speak for themselves</h1>
            <div class="flex items-center justify-center">
                <div class="bg-teal-800 mb-20 w-2/3 md:h-60 p-8 rounded-[12px] flex md:flex-row flex-col justify-between items-center text-white shadow-lg">
                    <div class="flex-1 text-center">
                        <p class="text-4xl font-bold">200x</p>
                        <p class="mt-2">more precision in<br /> book ratings</p>
                    </div>
                    <div class="md:h-16 h-0 md:w-0 w-16 md:my-0 my-10 md:border-l border-t border-teal-700 mx-4"></div>
                    <div class="flex-1 text-center">
                        <p class="text-4xl font-bold">60%</p>
                        <p class="mt-2">less time spent finding<br /> your next read </p>
                    </div>
                    <div class="md:h-16 h-0 md:w-0 w-16 md:my-0 my-10 md:border-l border-t border-teal-700 mx-4"></div>
                    <div class="flex-1 text-center">
                        <p class="text-4xl font-bold">9/10</p>
                        <p class="mt-2">users would recommend <br /> over Goodreads </p>
                    </div>
                </div>
            </div>

            <h1 className="md:text-5xl text-3xl text-center font-bold mt-20 mb-10">Easy, intuitive ranking system</h1>
            <div class="flex items-center justify-center">
                
                <img src="genres-demo.png" alt="Demo of genres.fyi" className="relative rounded-md md:w-2/5 w-5/6 mb-20" />
            </div>


            {/* Login Modal */}
            {isLoginVisible && (
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
    );
};

export default Homepage;



// import React from 'react';

// const Homepage = () => {
//     return (
//         <div className="min-h-screen flex flex-col">
//             {/* Header */}
//             <header className="flex justify-between items-center p-4">
//                 <div className="flex items-center">
//                     <img src="books.png" alt="Books" className="h-10 mr-2" />
//                     <span className="font-bold text-2xl">Genres.fyi</span>
//                 </div>
//                 <a href="/login" className="bg-black text-white rounded-md px-4 py-2">
//                     Explore books
//                 </a>
//             </header>

//             {/* Main Content */}
//             <main className="flex flex-1 justify-around items-center px-4 py-8 min-h-[90vh]">
//                 {/* Left Column */}
//                 <div className="flex flex-col w-1/3">
//                     <h1 className="text-7xl font-bold">Discover new reads & genres</h1>
//                     <p className="mt-4 text-lg">
//                         Expand your library with diverse recommendations powered by AI.
//                     </p>
//                     <a href="/login" className="mt-8 bg-gray-300 text-black rounded-md px-4 py-2 self-start">
//                         Explore books
//                     </a>
//                 </div>

//                 {/* Right Column */}
//                 <div className="relative w-2/5">
//                     <div className="absolute inset-0 bg-gray-300 transform translate-x-6 -translate-y-6 rounded-md w-full"></div>
//                     <img src="homepage2.jpg" alt="Mountain" className="relative rounded-md shadow-md" />
//                 </div>
//             </main>

//             {/* Footer */}
//             <div className="bg-gray-300 text-center py-16">
//                 <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
//                     <div className="flex flex-col items-center bg-white rounded-md shadow-md p-6">
//                         <h3 className="font-bold text-3xl mb-2">Compare</h3>
//                         <img src="compare.png" alt="Compare" className="my-4 w-40" />
//                         <p>1-5 stars is limiting, but choosing a more specific rating is hard. Just decide between pairs of books and let our algorithm do the rest.</p>
//                     </div>
//                     <div className="flex flex-col items-center bg-white rounded-md shadow-md p-6">
//                         <h3 className="font-bold text-3xl mb-2">Swipe</h3>
//                         <img src="swipe-left.png" alt="Swipe" className="my-4 w-40" />
//                         <p>Receive personalllized book recommendations based on the actual content of your favorite books in an easily digestible format.</p>
//                     </div>
//                     <div className="flex flex-col items-center bg-white rounded-md shadow-md p-6">
//                         <h3 className="font-bold text-3xl mb-2">Chat</h3>
//                         <img src="chatbot.png" alt="Chatbot" className="my-4 w-40" />
//                         <p>Talk to our chatbot, Giddy, to help you find <i>just</i> the book you're looking for.</p>
//                     </div>
//                 </div>
//             </div>


//         </div>
//     );
// };

// export default Homepage;
