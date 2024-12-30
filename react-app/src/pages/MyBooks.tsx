import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { BookRowModal } from '../components/BookRowModal';
import { UserBook, Rating, ApiResponse, UserAccount } from '../types/types';

interface ComparisonParams {
    workId: string;
    getNextUnranked: boolean;
}

function MyBooks() {
    const [books, setBooks] = useState<UserBook[]>([]);
    const [unrankedBook, setUnrankedBook] = useState<UserBook | null>(null);
    const [comparedBook, setComparedBook] = useState<UserBook | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [activeRow, setActiveRow] = useState<string | null>(null);
    const [getNextUnranked, setGetNextUnranked] = useState(true);
    const [userData, setUserData] = useState<UserAccount | null>(null);
    const [totalBooksRanked, setTotalBooksRanked] = useState<number>(0);

    useEffect(() => {
        axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/')
            .then(response => {
                setBooks(response.data.data || []);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    useEffect(() => {
        axiosInstance.get<ApiResponse<UserAccount>>('api/user/')
            .then(response => {
                setUserData(response.data.data || null);
                setTotalBooksRanked(response.data.data?.total_ranked_books_count || 0);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const refreshBooks = () => {
        setTimeout(() => {
            axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/')
                .then(response => {
                    setBooks(response.data.data || []);
                    refreshUserData();
                })
                .catch(error => {
                    console.error(error);
                });
        }, 500);
    };

    const fetchUnrankedBook = () => {
        axiosInstance.get<ApiResponse<UserBook>>('api/unranked-books/')
            .then(response => {
                const tempUnrankedBook = response.data.data || null;
                setUnrankedBook(tempUnrankedBook);
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
                fetchComparison({ workId: tempUnrankedBook.work_id, getNextUnranked });
            });
    };

    const fetchComparison = ({ workId, getNextUnranked }: ComparisonParams) => {
        axiosInstance.get<ApiResponse<UserBook>>('api/compare-book/', {
            params: { work_id: workId }
        })
            .then(response => {
                const comparedBook = response.data.data || null;
                if (comparedBook) {
                    setComparedBook(comparedBook);
                    setShowComparison(true);
                } else if (getNextUnranked) {
                    fetchUnrankedBook();
                } else {
                    setShowComparison(false);
                }
            });
    };

    const handleRatingClick = (rating: Rating) => {
        if (!unrankedBook) return;

        axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${unrankedBook.work_id}/`, {
            rating: rating,
        }).then(() => {
            setUnrankedBook(prevState => prevState ? {
                ...prevState,
                rating: rating
            } : null);
            if (unrankedBook) {
                fetchComparison({ workId: unrankedBook.work_id, getNextUnranked });
            }
        });
    };

    const handleComparisonClick = (o: number) => {
        if (!unrankedBook || !comparedBook) return;
        
        axiosInstance.post<ApiResponse<never>>('api/compare-book/', {
            new_book_id: unrankedBook.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: o,
        }).then(() => {
            if (o !== -1) { // we only refresh if the outcome actually resulted in rating update
                refreshBooks();
                refreshUserData();
            }
            if (unrankedBook) {
                fetchComparison({ workId: unrankedBook.work_id, getNextUnranked });
            }
        });
    };

    const handleSpecificRankClick = (book: UserBook) => {
        setUnrankedBook(book);
        setGetNextUnranked(false);
        if (book.rating !== null) {
            fetchComparison({ workId: book.work_id, getNextUnranked: false });
        }
        setShowComparison(true);
    };

    const handleGeneralRankClick = () => {
        setGetNextUnranked(true);
        fetchUnrankedBook();
    };

    const handleReRankClick = (book: UserBook) => {
        const updatedBook = { ...book, rating: null };
        setGetNextUnranked(false);
        setUnrankedBook(updatedBook);
        setShowComparison(true);
    };

    const handleRemoveClick = (book: UserBook) => {
        axiosInstance.delete<ApiResponse<never>>(`api/userbooks/${book.work_id}/`)
            .then(() => {
                refreshBooks();
            });
    };

    const handleRowClick = (bookId: string) => {
        setActiveRow(bookId === activeRow ? null : bookId);
    };

    const refreshUserData = () => {
        axiosInstance.get<ApiResponse<UserAccount>>('api/user/')
            .then(response => {
                setUserData(response.data.data || null);
                setTotalBooksRanked(response.data.data?.total_ranked_books_count || 0);
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <div className="container mx-auto items-center flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-6 text-center">My Books</h1>
            
            {totalBooksRanked < 15 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                    <p>Rank {15 - totalBooksRanked} more books to see ratings!</p>
                </div>
            )}

            {Array.isArray(books) && books.some(book => book.is_ranked === false) && (
                <button
                    className="mb-4 px-4 py-2 bg-teal-800 text-white rounded hover:bg-teal-900"
                    onClick={handleGeneralRankClick}
                >
                    Rank unranked books
                </button>
            )}

            <table className="table-fixed w-full rounded">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="px-4 py-2 text-center text-lg rounded-l">Cover</th>
                        <th className="px-4 py-2 text-center text-lg">Title</th>
                        <th className="px-4 py-2 text-center text-lg">Author</th>
                        <th className="px-4 py-2 text-center text-lg">Genre</th>
                        <th className="px-4 py-2 text-center text-lg">Type</th>
                        <th className="px-4 py-2 text-center text-lg">Rating</th>
                        <th className="px-4 py-2 text-center text-lg rounded-r">Date Added</th>
                    </tr>
                </thead>
                <tbody>
                    {books.map(book => (
                        <tr key={book.work_id} className="hover:bg-gray-100" onClick={() => handleRowClick(book.work_id)}>
                            <td className="px-4 py-2 text-center">
                                <img src={book.image_url} alt={book.title} className="inline-block rounded" />
                            </td>
                            <td className="px-4 py-2 text-center">{book.title}</td>
                            <td className="px-4 py-2 text-center">{book.author}</td>
                            <td className="px-4 py-2 text-center">{book.genre}</td>
                            <td className="px-4 py-2 text-center">{book.book_type}</td>
                            <td className="px-4 py-2 text-center">
                                {book.normalized_rating}
                            </td>
                            <td className="px-4 py-2 text-center relative">
                                {new Date(book.date_added).toLocaleDateString()}
                                {activeRow === book.work_id && (
                                    <BookRowModal
                                        handleSpecificRankClick={handleSpecificRankClick}
                                        handleReRankClick={handleReRankClick}
                                        handleRemoveClick={handleRemoveClick}
                                        book={book}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {unrankedBook && showComparison && unrankedBook.rating === null && (
                <RateModal
                    onClickFunction={handleRatingClick}
                    exitFunction={() => setShowComparison(false)}
                    book={unrankedBook}
                    status="SHOW_RATE_BUTTONS"
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

export default MyBooks; 