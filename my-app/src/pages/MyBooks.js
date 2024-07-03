import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';

function MyBooks() {
    const [books, setBooks] = useState([]);
    const [unrankedBook, setUnrankedBook] = useState(null);
    const [comparedBook, setComparedBook] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const outcome = useRef(0);

    useEffect(() => {
        // axiosInstance.defaults.headers.common['Authorization'] = 'Token ' + localStorage.getItem('token');
        axiosInstance.get('api/userbooks/')
            .then(response => {
                setBooks(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const fetchUnrankedBook = () => {
        axiosInstance.get('api/unranked-books/')
            .then(response => {
                const tempUnrankedBook = response.data;
                setUnrankedBook(response.data);
                // setShowModal(true);
                return tempUnrankedBook;
            })
            .catch(error => {
                console.error(error);
            })
            .then(tempUnrankedBook => {
                if (!tempUnrankedBook) {
                    setShowComparison(false);
                    return;
                }
                
                axiosInstance.get('api/compare-book/', {
                    params: {
                        work_id: tempUnrankedBook.work_id,
                        title: tempUnrankedBook.title,
                        author: tempUnrankedBook.author,
                    }
                })
                    .then(response => {
                        const comparedBook = response.data;
                        setComparedBook(comparedBook);
                        setShowComparison(true);
                    });
            })
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
                    // instead of setting to false we get the next unranked book
                    fetchUnrankedBook();
                }
            })
    };

    const handleComparisonClick = (o) => {
        if (o === 1) {
            outcome.current = 1;
        } else {
            outcome.current = 0;
        }
        axiosInstance.post('api/compare-book/', {
            new_book_id: unrankedBook.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: outcome.current,
        }).then(() => {
            fetchComparison(unrankedBook.work_id);
        });
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-4 text-center">My Books</h1>
            <button
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                onClick={fetchUnrankedBook}
            >
                Rank Unranked Books
            </button>
            <table className="table-fixed w-full">
                <thead>
                    <tr className="bg-gray-300">
                        <th className="px-4 py-2 text-center text-lg">Title</th>
                        <th className="px-4 py-2 text-center text-lg">Author</th>
                        <th className="px-4 py-2 text-center text-lg">Rating</th>
                        <th className="px-4 py-2 text-center text-lg">Elo</th>
                        <th className="px-4 py-2 text-center text-lg">Ranked?</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map(book => (
                        <tr key={book.id}>
                            <td className="px-4 py-2 text-center">{book.title}</td>
                            <td className="px-4 py-2 text-center">{book.author}</td>
                            <td className="px-4 py-2 text-center">{book.rating}</td>
                            <td className="px-4 py-2 text-center">{book.normalized_rating}</td>
                            <td className="px-4 py-2 text-center">{book.is_ranked ? 'True' : 'False'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {unrankedBook && showComparison && comparedBook && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="relative bg-white rounded-lg p-6 opacity-95 w-1/2">
            <button
                className="absolute top-2 right-2 w-8 h-8 text-black rounded flex items-center justify-center"
                onClick={() => setShowComparison(false)}
            >
                <i className="fas fa-times"></i>
            </button>
            <div className="flex justify-around mt-8">
                <div className="w-1/3 p-4 bg-gray-200 hover:bg-gray-300 rounded" onClick={() => handleComparisonClick(1)}>
                    <img src={unrankedBook.image_url} className="mx-auto mb-4" />
                    <h2 className="text-lg text-center font-bold">{unrankedBook.title}</h2>
                    <p className="text-center">{unrankedBook.author}</p>
                    <p className="text-center">{unrankedBook.normalized_rating}</p>
                </div>
                <div className="w-1/3 p-4 bg-gray-200 hover:bg-gray-300 rounded" onClick={() => handleComparisonClick(0)}>
                    <img src={comparedBook.image_url} className="mx-auto mb-4" />
                    <h2 className="text-lg text-center font-bold">{comparedBook.title}</h2>
                    <p className="text-center">{comparedBook.author}</p>
                    <p className="text-center">{comparedBook.normalized_rating}</p>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );
}

export default MyBooks;
