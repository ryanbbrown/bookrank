import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-black text-white py-12 w-full">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-2 md:mb-0">
                    &copy; 2024 Genres.fyi
                </div>
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                    <a href="mailto:contact@genres.fyi" className="hover:underline">
                        Contact
                    </a>
                    <Link to="/termsofservice" className="hover:underline">
                        Terms of Service
                    </Link>
                    <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Privacy Policy
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
