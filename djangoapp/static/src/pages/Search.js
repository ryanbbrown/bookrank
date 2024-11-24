import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';
import RateModal from '../components/RateModal';
import CompareModal from '../components/CompareModal';
// import tailwind from 'tailwindcss/defaultConfig';

// axiosInstance.defaults.headers.common['Authorization'] = 'Token ' + localStorage.getItem('token');
// axiosInstance.defaults.withCredentials = true;

function Search() {
    // things that directly affect what the user sees on the screen 
    // const [query, setQuery] = useState('');
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [comparedBook, setComparedBook] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showSearchedBook, setShowSearchedBook] = useState(false);

    // things that don't directly affect what the user sees on the screen; backend stuff
    const outcome = useRef(0);
    const searchForm = useRef(null);  // ends up being large reference to form itself
    // should maybe be state but idk seems confusing bc of searchForm.current.value
    // and whatever bc it does update the search box to be blank soooo

    const handleSearch = (event) => {
        event.preventDefault();
        axiosInstance.get('api/search/', { params: { query: searchForm.current.value } })
            .then(response => {
                const searchbooklist = response.data;
                setBooks(searchbooklist);
            });
    };

    const handleRowClick = (book) => {
        setSelectedBook(book);
        setShowSearchedBook(true);
    };

    const handleAddFinishedBook = (rating) => {
        const workId = selectedBook.work_id;
        const title = selectedBook.title;
        const author = selectedBook.author;
        axiosInstance.post('api/add-finished-book/', {
            work_id: workId,
            title: title,
            author: author,
            rating: rating,
        })
            .then(response => {
                searchForm.current.value = '';
                setBooks([]);
                setShowSearchedBook(false);
                if (rating === 'high') {
                    axiosInstance.post('api/add-recommendations/', {
                        work_id: workId
                    });
                }
                axiosInstance.get('api/compare-book/', {
                    params: {
                        work_id: workId,
                        title: title,
                        author: author,
                    }
                }).then(response => {
                    const comparedBook = response.data;
                    setComparedBook(comparedBook);
                    setShowComparison(true);
                });
            });
    };

    const handleAddTBR = () => {
        const workId = selectedBook.work_id;
        const title = selectedBook.title;
        const author = selectedBook.author;
        const image_url = selectedBook.image_url;
        console.log('workId', workId);
        axiosInstance.post('api/to-be-read/', {
            work_id: workId,
            title: title,
            author: author,
            image_url: image_url,
        })
            .then(response => {
                // setQuery('');
                searchForm.current.value = '';
                setBooks([]);
                setShowSearchedBook(false);
                // setSelectedBook(null);
            });
    };

    const fetchComparison = (workId) => {
        axiosInstance.get('api/compare-book/', {
            params: { work_id: workId }
        })
            .then(response => {
                const comparedBook = response.data;
                if (comparedBook) {
                    setComparedBook(comparedBook);
                    setShowComparison(true);
                } else {
                    setShowComparison(false);
                }
            });
    };

    const handleComparisonClick = (o) => {
        outcome.current = o;
        axiosInstance.post('api/compare-book/', {
            new_book_id: selectedBook.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: outcome.current,
        }).then(() => {
            fetchComparison(selectedBook.work_id);
        });
    };

    return (
        <div
            className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2 gap-4"
        >
            <h1 className="text-4xl font-bold mb-4 text-center">Search</h1>
            <div className="w-full flex flex-col items-center justify-center">
                <form onSubmit={handleSearch} className="flex w-2/3">
                    <input
                        type="text"
                        ref={searchForm}
                        className="flex-grow p-2 pl-10 text-sm text-black rounded-l bg-gray-200 outline-none"
                        placeholder="Search for a book"
                    />
                    <button
                        type="submit"
                        className="p-2 text-sm bg-gray-200 rounded-r flex items-center justify-center"
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>


            {books.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 text-center text-lg rounded-l">Cover</th>
                            <th className="px-4 py-2 text-center text-lg">Title</th>
                            <th className="px-4 py-2 text-center text-lg rounded-r">Author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map((book) => (
                            <tr key={book.title} onClick={() => handleRowClick(book)} className="hover:bg-gray-100">
                                <td className="px-4 py-2 text-center rounded-l"><img src={book.image_url} alt={book.title} className="inline-block rounded" /></td>
                                <td className="text-center">{book.title}</td>
                                <td className="text-center rounded-r">{book.author}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}


            {selectedBook && showSearchedBook && (
                <RateModal
                    onClickFunction={handleAddFinishedBook}
                    exitFunction={() => setShowSearchedBook(false)}
                    addTBRFunction={handleAddTBR}
                    book={selectedBook}
                />
            )}
            {showComparison && comparedBook && (
                <CompareModal
                    handleComparisonClick={handleComparisonClick}
                    selectedBook={selectedBook}
                    comparedBook={comparedBook}
                />
            )}
        </div>
    );
}

export default Search;

