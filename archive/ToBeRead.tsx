import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { BookRow } from '../components/BookRow';
import { ApiResponse, UserBook, BookStatus, Bucket } from '../types/types';

function ToBeRead() {
    const [books, setBooks] = useState<UserBook[]>([]);
    const [unratedBook, setUnratedBook] = useState<UserBook | null>(null);
    const [ratedBook, setRatedBook] = useState<UserBook | null>(null);
    const [comparedBook, setComparedBook] = useState<UserBook | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [activeRow, setActiveRow] = useState<string | null>(null);
    const [showRateModal, setShowRateModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

    useEffect(() => {
        axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/', {
            params: { status: BookStatus.TO_BE_READ }
        })
        .then(response => {
            setBooks(response.data.data || []);
        })
        .catch(error => {
            console.error(error);
        });
    }, []);

    const refreshBooks = () => {
        axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/', {
            params: { status: BookStatus.TO_BE_READ }
        })
        .then(response => {
            setBooks(response.data.data || []);
        })
        .catch(error => {
            console.error(error);
        });
    };

    const handleMarkAsRead = (book: UserBook) => {
        setSelectedBook(book);  //this used to be setUnratedBook
        setShowRateModal(true);
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

    const handleBucketClick = (bucket: Bucket) => {
        if (!unratedBook) return;

        axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${unratedBook.work_id}/`, {
            status: BookStatus.READ,
            bucket: bucket,
        }).then(() => {
            setRatedBook({
                ...unratedBook,
                status: BookStatus.READ,
                bucket: bucket,
                normalized_rating: null,
                is_ranked: false
            });
            
            fetchComparison({ workId: unratedBook.work_id });
            refreshBooks();
        });
    };

    const fetchComparison = ({ workId }: { workId: string }) => {
        axiosInstance.get<ApiResponse<UserBook>>('api/compare-book/', {
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

    const handleMarkAsCurrentlyReading = (book: UserBook) => {
        axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${book.work_id}/`, {
            status: BookStatus.CURRENTLY_READING
        })
        .then(() => {
            refreshBooks();
        });
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-6 text-center">To Be Read</h1>
            
            <div className="space-y-4">
                {books.map(book => (
                    <BookRow
                        key={book.work_id}
                        book={book}
                        isActive={activeRow === book.work_id}
                        onRowClick={handleRowClick}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAsCurrentlyReading={handleMarkAsCurrentlyReading}
                        onRemove={handleRemoveClick}
                    />
                ))}
            </div>

            {showRateModal && selectedBook && (
                <RateModal
                    book={selectedBook}
                    exitFunction={() => setShowRateModal(false)}
                    onClickFunction={(bucket) => {
                        axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${selectedBook.work_id}/`, {
                            status: BookStatus.READ,
                            bucket
                        })
                        .then(() => {
                            setShowRateModal(false);
                            refreshBooks();
                        });
                    }}
                    status="SHOW_RATE_BUTTONS"
                />
            )}

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