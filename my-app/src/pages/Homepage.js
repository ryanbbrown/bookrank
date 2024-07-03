import React from 'react';

const Homepage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4">
                <div className="flex items-center">
                    <img src="books.png" alt="Books" className="h-10 mr-2" />
                    <span className="font-bold text-2xl">Genres.fyi</span>
                </div>
                <a href="/login" className="bg-black text-white rounded-md px-4 py-2">
                    Explore books
                </a>
            </header>

            {/* Main Content */}
            <main className="flex flex-1 justify-around items-center px-4 py-8 min-h-[90vh]">
                {/* Left Column */}
                <div className="flex flex-col w-1/3">
                    <h1 className="text-7xl font-bold">Discover new reads & genres</h1>
                    <p className="mt-4 text-lg">
                        Expand your library with diverse recommendations powered by AI.
                    </p>
                    <a href="/login" className="mt-8 bg-gray-300 text-black rounded-md px-4 py-2 self-start">
                        Explore books
                    </a>
                </div>

                {/* Right Column */}
                <div className="relative w-2/5">
                    <div className="absolute inset-0 bg-gray-300 transform translate-x-6 -translate-y-6 rounded-md w-full"></div>
                    <img src="homepage2.jpg" alt="Mountain" className="relative rounded-md shadow-md" />
                </div>
            </main>

            {/* Footer */}
            <div className="bg-gray-300 text-center py-16">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center bg-white rounded-md shadow-md p-6">
                        <h3 className="font-bold text-3xl mb-2">Compare</h3>
                        <img src="compare.png" alt="Compare" className="my-4 w-40" />
                        <p>1-5 stars is limiting, but choosing a more specific rating is hard. Just decide between pairs of books and let our algorithm do the rest.</p>
                    </div>
                    <div className="flex flex-col items-center bg-white rounded-md shadow-md p-6">
                        <h3 className="font-bold text-3xl mb-2">Swipe</h3>
                        <img src="swipe-left.png" alt="Swipe" className="my-4 w-40" />
                        <p>Receive personalized book recommendations based on the actual content of your favorite books in an easily digestible format.</p>
                    </div>
                    <div className="flex flex-col items-center bg-white rounded-md shadow-md p-6">
                        <h3 className="font-bold text-3xl mb-2">Chat</h3>
                        <img src="chatbot.png" alt="Chatbot" className="my-4 w-40" />
                        <p>Talk to our chatbot, Giddy, to help you find <i>just</i> the book you're looking for.</p>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default Homepage;
