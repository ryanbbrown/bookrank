import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { BookRowModal } from '../components/BookRowModal';
import { ApiResponse, Book, TBRBook,UserBook, Rating } from '../types/types';

interface ComparisonParams {
    workId: string;
}

function ToBeRead() {
    const [books, setBooks] = useState<TBRBook[]>([]);
    const [unratedBook, setUnratedBook] = useState<TBRBook | null>(null);
    const [ratedBook, setRatedBook] = useState<UserBook | null>(null);
    const [comparedBook, setComparedBook] = useState<UserBook | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [activeRow, setActiveRow] = useState<string | null>(null);

    useEffect(() => {
        axiosInstance.get<ApiResponse<Array<TBRBook>>>('api/to-be-read/')
            .then(response => {
                setBooks(response.data.data || []);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const refreshBooks = () => {
        setTimeout(() => {
            axiosInstance.get<ApiResponse<Array<TBRBook>>>('api/to-be-read/')
                .then(response => {
                    setBooks(response.data.data || []);
                })
                .catch(error => {
                    console.error(error);
                });
        }, 500);
    };

    const handleRowClick = (bookId: string) => {
        setActiveRow(bookId === activeRow ? null : bookId);
    };

    const handleSpecificRankClick = (book: TBRBook) => {
        setUnratedBook(book);
        setShowComparison(true);
    };

    const handleRemoveClick = (book: TBRBook) => {
        axiosInstance.delete<ApiResponse<never>>('api/to-be-read/', {
            params: { work_id: book.work_id }
        }).then(() => {
            refreshBooks();
        });
    };

    const fetchComparison = ({ workId }: ComparisonParams) => {
        axiosInstance.get<ApiResponse<UserBook>>('api/compare-book/', {
            params: { work_id: workId }
        })
        .then(response => {
            const comparedBook = response.data.data;
            if (comparedBook) {
                console.log('Got compared book')
                setComparedBook(comparedBook);
                setShowComparison(true);
            } else {
                setShowComparison(false);
            }
        });
    };

    const handleRatingClick = (rating: Rating) => {
        if (!unratedBook) return;

        axiosInstance.post<ApiResponse<never>>('api/userbooks/', {
            work_id: unratedBook.work_id,
            rating: rating,
        }).then(() => {
            setRatedBook({
                ...unratedBook,
                rating: rating,
                normalized_rating: null
            });
            
            if (unratedBook) {
                fetchComparison({ workId: unratedBook.work_id });
                axiosInstance.delete<ApiResponse<never>>('api/to-be-read/', {
                    params: { work_id: unratedBook.work_id }
                }).then(() => {
                    setUnratedBook(null);
                    refreshBooks();
                });
            }
        });
    };

    const handleComparisonClick = (o: number) => {
        if (!ratedBook || !comparedBook) return;
        
        axiosInstance.post<ApiResponse<never>>('api/compare-book/', {
            new_book_id: ratedBook.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: o,
        }).then(() => {
            if (o !== -1) { // we only refresh if the outcome actually resulted in rating update
                refreshBooks();
            }
            fetchComparison({ workId: ratedBook.work_id });
        });
    };

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
                        <tr key={book.work_id} className="hover:bg-gray-100" onClick={() => handleRowClick(book.work_id)}>
                            <td className="px-4 py-2 text-center">
                                <img src={book.image_url} alt={book.title} className="inline-block rounded" />
                            </td>
                            <td className="px-4 py-2 text-center">{book.title}</td>
                            <td className="px-4 py-2 text-center">{book.author}</td>
                            <td className="px-4 py-2 text-center relative">
                                {new Date(book.date_added).toLocaleDateString()}
                                {activeRow === book.work_id && (
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

            {unratedBook && showComparison && (
                <RateModal
                    onClickFunction={handleRatingClick}
                    exitFunction={() => setShowComparison(false)}
                    book={unratedBook}
                />
            )}
            {/* .rating !== null */}
            {showComparison && comparedBook && ratedBook && (
                <CompareModal
                    handleComparisonClick={handleComparisonClick}
                    exitFunction={() => setShowComparison(false)}
                    selectedBook={ratedBook}
                    comparedBook={comparedBook}
                />
            )}
        </div>
    );
}

export default ToBeRead; 