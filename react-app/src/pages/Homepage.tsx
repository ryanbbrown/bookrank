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
        <div className="relative">
            
            {/* Hero Section */}
            <div className="flex flex-col items-center text-center relative px-6 py-20 mx-auto">
               
                <div className="py-20 flex flex-col items-center text-center w-[95%] xl:w-[65%] relative">
                    {/* Left reader illustration */}
                    <img 
                        src="reader_left.png" 
                        alt="Person reading"
                        className="
                            absolute 
                            hidden xl:block
                            w-auto h-[20vh]
                            right-[95%]
                            top-[60%] lg:top-[60%]
                            transform -translate-y-1/2
                            opacity-90
                            pointer-events-none
                            object-contain
                            -z-10
                        "
                    />

                    {/* Right reader illustration */}
                    <img 
                        src="reader_right.png" 
                        alt="Person reading"
                        className="
                            absolute 
                            hidden xl:block
                            w-auto h-[40vh]
                            left-[105%]
                            top-[50%] lg:top-[50%]
                            transform -translate-y-1/2
                            opacity-90
                            pointer-events-none
                            object-contain
                            -z-10
                        "
                    />
                    <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl 2xl:text-7xl font-bold tracking-tight max-w-4xl">
                        The <span className="text-homepage-blue">smarter</span> way to discover your next read
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-xl">
                        Rank books intuitively and receive recommendations tailored to <span className="font-bold">your</span> library, powered by AI.
                    </p>
                    <Button
                        onClick={toggleLoginModal}
                        className="mt-10 bg-homepage-blue hover:bg-indigo-500 text-white px-8 py-6 text-md rounded-lg"
                    >
                        Try the Beta today
                    </Button>
                </div>
                
            </div>

            {/* Why Choose Us Section */}
            <div className="pt-[30vh] px-6">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">Why use BookRank?</h2>
                    <p className="mt-4 text-gray-600">BookRank offers unique features to help you discover your next favorite book</p>
                </div>
                <div className="container mx-auto w-full sm:w-4/5 xl:w-full 2xl:w-4/5 grid grid-cols-1 xl:grid-cols-3 gap-12">
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="compare.png" alt="Compare" className="my-4 w-20" />
                            <h3 className="font-bold text-2xl mb-2">Compare</h3>
                            <p className="text-gray-600">1-5 stars is limiting, but choosing a more specific rating is hard. Just decide between pairs of books and let our algorithm do the rest.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="swipe-left.png" alt="Swipe" className="my-4 w-20" />
                            <h3 className="font-bold text-2xl mb-2">Swipe</h3>
                            <p className="text-gray-600">Receive personalized book recommendations that learn from your preferences, based on the actual content of your favorite books.</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <img src="import.png" alt="Import" className="my-4 w-20" />
                            <h3 className="font-bold text-2xl mb-2">Import</h3>
                            <p className="text-gray-600">Easily import your reading history for a seamless transition. No more frustration with Goodread's clunky interface and generic book recs.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Stats Section */}
            <div className="pt-40 px-6">
                <div className="w-full sm:w-2/3 mx-auto text-center mb-12">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">Is switching worth it?</h2>
                    <p className="mt-4 text-gray-600">We could tell you that it absolutely is, but we'll let the numbers speak for themselves</p>
                </div>
                <div className="flex items-center justify-center">
                    <div className="bg-homepage-blue mb-20 w-4/5 2xl:w-2/3 md:h-60 p-8 rounded-[12px] flex md:flex-row flex-col justify-between items-center text-white shadow-lg">
                        <div className="flex-1 text-center">
                            <p className="text-4xl font-bold">200x</p>
                            <p className="mt-2">more precision in<br /> book ratings</p>
                        </div>
                        <div className="md:h-16 h-0 md:w-0 w-16 md:my-0 my-10 md:border-l border-t border-indigo-500 mx-4"></div>
                        <div className="flex-1 text-center">
                            <p className="text-4xl font-bold">60%</p>
                            <p className="mt-2">less time spent finding<br /> your next read </p>
                        </div>
                        <div className="md:h-16 h-0 md:w-0 w-16 md:my-0 my-10 md:border-l border-t border-indigo-500 mx-4"></div>
                        <div className="flex-1 text-center">
                            <p className="text-4xl font-bold">9/10</p>
                            <p className="mt-2">users would recommend <br /> over Goodreads </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How to get started */}
            <div className="py-20">
                <div className="max-w-4xl text-center mb-12 mx-auto flex flex-col items-center">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">How to get started?</h2>
                    <p className="mt-4 text-gray-600">It's easy! Just sign up, upload your reading history, and start comparing books</p>
                    <Button
                        onClick={toggleLoginModal}
                        className="mt-10 bg-homepage-blue hover:bg-indigo-500 text-white px-8 py-6 text-md rounded-lg"
                    >
                        Try the Beta today
                    </Button>
                </div>
            </div>

            {/* Ranking System Section */}
            {/* <div className="py-16">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="md:text-5xl text-3xl font-bold tracking-tighter">Easy, intuitive ranking system</h2>
                    <p className="mt-4 text-gray-600">Compare books side by side to create your personalized ranking</p>
                </div>
                <div className="flex items-center justify-center">
                    <img src="genres-demo.png" alt="Demo of genres.fyi" className="relative rounded-md md:w-2/5 w-5/6 mb-20" />
                </div>
            </div> */}
        </div>
    );
};

export default Homepage;
