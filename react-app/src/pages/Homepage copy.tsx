import React from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

interface HomepageProps {
  handleLoginSuccess: () => void;
  isLoggedIn: boolean;
  showLoginModal: boolean;
  toggleLoginModal: () => void;
}

const Homepage = ({ 
  handleLoginSuccess, 
  isLoggedIn, 
  showLoginModal, 
  toggleLoginModal 
}: HomepageProps) => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <main className="flex sm:flex-1 md:flex-row flex-col md:justify-center items-center px-4 py-8 md:min-h-[90vh] bg-white">
                <div className="flex flex-col md:w-1/3 w-4/5 mr-5">
                    <h1 className="sm:text-7xl text-4xl font-bold tracking-tighter">Discover new reads</h1>
                    <p className="mt-4 sm:text-lg text-gray-600">
                        Expand your library with diverse recommendations powered by AI.
                    </p>
                    <Button
                        onClick={toggleLoginModal}
                        className="md:mt-8 mt-4 md:mb-0 mb-5 self-start"
                        variant="secondary"
                    >
                        Explore books
                    </Button>
                </div>

                <div className="relative md:w-2/5 w-4/5 md:mt-0 mt-10 md:ml-5 ml-0">
                    <div className="absolute inset-0 bg-gray-300 transform translate-x-6 -translate-y-6 rounded-md w-full"></div>
                    <img src="homepage2.jpg" alt="Mountain" className="relative rounded-md shadow-md" />
                </div>
            </main>

            {/* Why Choose Us Section */}
            <div className="bg-gray-100 py-16">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">Why choose us</h2>
                    <p className="mt-4 text-gray-600">Our platform offers unique features to help you discover your next favorite book</p>
                </div>
                <div className="container mx-auto md:w-1/2 w-4/5 grid grid-cols-1 md:grid-cols-2 gap-12">
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="compare.png" alt="Compare" className="my-4 w-20" />
                            <h3 className="font-bold text-3xl mb-2">Compare</h3>
                            <p className="text-gray-600">1-5 stars is limiting, but choosing a more specific rating is hard. Just decide between pairs of books and let our algorithm do the rest.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="swipe-left.png" alt="Swipe" className="my-4 w-20" />
                            <h3 className="font-bold text-3xl mb-2">Swipe</h3>
                            <p className="text-gray-600">Receive personalized book recommendations based on the actual content of your favorite books in an easily digestible format.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="chatbot.png" alt="Chatbot" className="my-4 w-20" />
                            <h3 className="font-bold text-3xl mb-2">Chat</h3>
                            <p className="text-gray-600">Talk to our chatbot to help you find <i>just</i> the book you're looking for. War in a fairie woodland? Android space romance? We got you.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="import.png" alt="Import" className="my-4 w-20" />
                            <h3 className="font-bold text-3xl mb-2">Import</h3>
                            <p className="text-gray-600">Easily import your reading history for a seamless transition. No more frustration with Goodread's clunky interface and generic book recs.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white py-16">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">The numbers speak for themselves</h2>
                </div>
                <div className="flex items-center justify-center">
                    <div className="bg-teal-800 mb-20 w-2/3 md:h-60 p-8 rounded-[12px] flex md:flex-row flex-col justify-between items-center text-white shadow-lg">
                        <div className="flex-1 text-center">
                            <p className="text-4xl font-bold">200x</p>
                            <p className="mt-2">more precision in<br /> book ratings</p>
                        </div>
                        <div className="md:h-16 h-0 md:w-0 w-16 md:my-0 my-10 md:border-l border-t border-teal-700 mx-4"></div>
                        <div className="flex-1 text-center">
                            <p className="text-4xl font-bold">60%</p>
                            <p className="mt-2">less time spent finding<br /> your next read </p>
                        </div>
                        <div className="md:h-16 h-0 md:w-0 w-16 md:my-0 my-10 md:border-l border-t border-teal-700 mx-4"></div>
                        <div className="flex-1 text-center">
                            <p className="text-4xl font-bold">9/10</p>
                            <p className="mt-2">users would recommend <br /> over Goodreads </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ranking System Section */}
            <div className="bg-gray-100 py-16">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">Easy, intuitive ranking system</h2>
                    <p className="mt-4 text-gray-600">Compare books side by side to create your personalized ranking</p>
                </div>
                <div className="flex items-center justify-center">
                    <img src="genres-demo.png" alt="Demo of genres.fyi" className="relative rounded-md md:w-2/5 w-5/6 mb-20" />
                </div>
            </div>
        </div>
    );
};

export default Homepage;
