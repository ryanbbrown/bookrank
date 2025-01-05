import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './tailwind.css';
import Login from './pages/Login';
import Search from './pages/Search';
import MyBooks from './pages/MyBooks';
import { Header } from './components/Header';
import Recommendations from './pages/Recommendations';
import GoodreadsImport from './pages/GoodreadsImport';
import { Footer } from './components/Footer';
import TermsOfService from './pages/TermsOfService';
import Homepage from './pages/Homepage';
import axiosInstance from './axiosConfig';
import { ApiResponse } from './types/types';
import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

// Move QueryClient outside of the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

// this makes it so that the search page re-mounts when the query param (in url) changes
// which is necessary for the search box input to update
function SearchWrapper() {
    const [searchParams] = useSearchParams();
    return <Search key={searchParams.get('q')} />;
}

function App(): JSX.Element {

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        const savedLoginState = sessionStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(savedLoginState);
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        sessionStorage.setItem('isLoggedIn', 'true');
        setShowLoginModal(false);
    };

    const handleLogout = async () => {
        try {
            await axiosInstance.post<ApiResponse<never>>('api/logout/');
            setIsLoggedIn(false);
            sessionStorage.removeItem('isLoggedIn');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleLoginModal = () => {
        setShowLoginModal(!showLoginModal);
    };

    return (
        <QueryProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-white py-6">
                    <div className="mx-auto w-[95%] md:w-[90%] lg:w-[75%] bg-gray-50 rounded-xl shadow-lg min-h-screen flex flex-col relative z-0">
                        <Header 
                            isLoggedIn={isLoggedIn} 
                            handleLogout={handleLogout}
                            toggleLoginModal={toggleLoginModal}
                        />
                        <main className="flex-grow">
                            <React.Suspense fallback={<div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div></div>}>
                                <Routes>
                                    <Route 
                                        path="/" 
                                        element={
                                            <Homepage 
                                                handleLoginSuccess={handleLoginSuccess}
                                                isLoggedIn={isLoggedIn}
                                                showLoginModal={showLoginModal}
                                                toggleLoginModal={toggleLoginModal}
                                            />
                                        } 
                                    />
                                    <Route 
                                        path="/login" 
                                        element={
                                            <Login 
                                                handleLoginSuccess={handleLoginSuccess} 
                                                toggleLoginModal={toggleLoginModal}
                                            />
                                        } 
                                    />
                                    <Route path="/search" element={<SearchWrapper />} />
                                    <Route path="/mybooks/:status" element={<MyBooks />} />
                                    <Route path="/myrecs" element={<Recommendations />} />
                                    <Route path="/goodreadsimport" element={<GoodreadsImport />} />
                                    <Route path="/termsofservice" element={<TermsOfService />} />
                                </Routes>
                            </React.Suspense>
                        </main>
                        <Footer />
                        {showLoginModal && !isLoggedIn && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                                <div className="relative bg-white rounded-lg p-6 sm:w-3/4 md:w-2/3 l:w-1/3 xl:w-1/3 shadow-md">
                                    <button
                                        className="absolute top-2 right-2 w-8 h-8 text-black rounded flex items-center justify-center"
                                        onClick={toggleLoginModal}
                                        aria-label="Close login modal"
                                    >
                                        <i className="fas fa-times" />
                                    </button>
                                    <Login
                                        handleLoginSuccess={handleLoginSuccess}
                                        toggleLoginModal={toggleLoginModal}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </BrowserRouter>
        </QueryProvider>
    );
}

export default App; 