import React from 'react';
import { Link } from 'react-router-dom'

export function Footer(): JSX.Element {
    return (
        <footer className="mt-auto border-t border-gray-200">
            <div className="container mx-auto py-8 px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <img src="/books.png" alt="Logo" className="w-5 opacity-50" />
                        <span className="text-gray-600 text-sm">
                            © 2024 BookRank.ai
                        </span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <a 
                            href="mailto:ryan@bookrank.ai" 
                            className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                        >
                            Contact
                        </a>
                        <Link 
                            to="/termsofservice" 
                            className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                        >
                            Terms of Service
                        </Link>
                        <a 
                            href="https://google.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                        >
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
} 