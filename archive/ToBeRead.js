import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';
import { RateModal } from '../components/RateModal.tsx';
import { CompareModal } from '../components/CompareModal.tsx';
import { BookRowModal } from '../components/BookRowModal.tsx';

function ToBeRead() {
    const [books, setBooks] = useState([]);
    const [unrankedBook, setUnrankedBook] = useState(null);
    const [comparedBook, setComparedBook] = useState(null);
    const [showComparison, setShowComparison] = useState(false);
    const [activeRow, setActiveRow] = useState(null);
    const outcome = useRef(0);

    useEffect(() => {
        axiosInstance.get('api/to-be-read/')
            .then(response => {
                setBooks(response.data.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const refreshBooks = () => {
        setTimeout(() => {
            axiosInstance.get('api/to-be-read/')
                .then(response => {
                    setBooks(response.data.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }, 500);
    };

    const handleRowClick = (bookId) => {
        setActiveRow(bookId === activeRow ? null : bookId); // Toggle the active row
    };

    const handleSpecificRankClick = (book) => {
        console.log(book)
        setUnrankedBook(book);
        // if (book.rating !== null) {
        //     fetchComparison({ workId: book.work_id, getNextUnranked: false });
        // }
        setShowComparison(true);
    }

    const handleRemoveClick = (book) => {
        axiosInstance.delete('api/to-be-read/', {
            params: { work_id: book.work_id }
        }).then(() => {
            refreshBooks();
        });
    };


    const fetchComparison = ({ workId, getNextUnranked }) => {
        axiosInstance.get('api/compare-book/', {
            params: { work_id: workId }
        })
            .then(response => {
                const comparedBook = response.data.data;
                if (comparedBook) {
                    setComparedBook(comparedBook);
                    setShowComparison(true);
                } else {
                    setShowComparison(false);
                }
            })
    };

    const handleRatingClick = (rating) => {
        axiosInstance.post('api/add-finished-book/', {
            work_id: unrankedBook.work_id,
            rating: rating,
        }).then(() => {
            setUnrankedBook(prevState => ({
                ...prevState, rating: rating
            }));
            fetchComparison({ workId: unrankedBook.work_id, getNextUnranked: false });
            axiosInstance.delete('api/to-be-read/', {
                params: { work_id: unrankedBook.work_id }
            }).then(() => {
                refreshBooks();
            });
        });
    }

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
            refreshBooks();
            fetchComparison({ workId: unrankedBook.work_id, getNextUnranked: false });
        });
    };

    // TODO: rn i have to refresh before a non-rated book shows up with RateModel instead of CompareModal
    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-6 text-center">To Be Read</h1>
            <table className="table-fixed w-full">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-center text-lg rounded-l">Cover</th>
                        <th className="px-4 py-2 text-center text-lg">Title</th>
                        <th className="px-4 py-2 text-center text-lg">Author</th>
                        <th className="px-4 py-2 text-center text-lg rounded-r">Date Added</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map(book => (
                        <tr key={book.id} className="hover:bg-gray-100" onClick={() => handleRowClick(book.id)}>
                            <td className="px-4 py-2 text-center"><img src={book.image_url} alt={book.title} className="inline-block rounded" /></td>
                            <td className="px-4 py-2 text-center">{book.title}</td>
                            <td className="px-4 py-2 text-center">{book.author}</td>
                            <td className="px-4 py-2 text-center relative">{new Date(book.date_added).toLocaleDateString()}
                                {/* Conditionally render the box */}
                                {activeRow === book.id && (
                                    <BookRowModal
                                    handleSpecificRankClick={handleSpecificRankClick}
                                    handleRemoveClick={handleRemoveClick}
                                    book={book}
                                />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* !unrankedBook.hasOwnProperty('rating') && */}
            {unrankedBook && showComparison && (
                <RateModal
                    onClickFunction={handleRatingClick}
                    exitFunction={() => setShowComparison(false)}
                    book={unrankedBook}
                />
            )}
            {unrankedBook && showComparison && comparedBook && unrankedBook.rating !== null && (
                <CompareModal
                    handleComparisonClick={handleComparisonClick}
                    exitFunction={() => setShowComparison(false)}
                    selectedBook={unrankedBook}
                    comparedBook={comparedBook}
                />
            )}
        </div>
    );
}

export default ToBeRead;