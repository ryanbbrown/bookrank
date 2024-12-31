import React, { useState, useEffect, useRef } from 'react';
import { BiLoaderAlt } from 'react-icons/bi';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { BookRowModal } from '../components/BookRowModal';
import { UserBook, Rating, ApiResponse, UserAccount } from '../types/types';
import { BookRow } from '../components/BookRow';

interface ComparisonParams {
    workId: string;
    getNextUnranked: boolean;
}

function MyBooks() {
    const [books, setBooks] = useState<UserBook[]>([]);
    const [displayedBooks, setDisplayedBooks] = useState<UserBook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef<HTMLDivElement>(null);
    const currentPage = useRef(0);
    const INITIAL_LOAD = 20;
    const PER_PAGE = 10;
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
                const allBooks = response.data.data || [];
                setBooks(allBooks);
                setDisplayedBooks(allBooks.slice(0, INITIAL_LOAD));
                setHasMore(allBooks.length > INITIAL_LOAD);
                currentPage.current = 0;
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    useEffect(() => {
        if (books.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !isLoading) {
                    loadMoreBooks();
                }
            },
            { threshold: 0.1 }
        );

        const currentLoader = loadingRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, isLoading, books]);

    const loadMoreBooks = () => {
        if (books.length === 0) return;
        
        setIsLoading(true);
        const start = currentPage.current * PER_PAGE + INITIAL_LOAD;
        const end = start + PER_PAGE;
        
        setTimeout(() => {
            const newBooks = books.slice(start, end);
            setDisplayedBooks(prev => [...prev, ...newBooks]);
            setHasMore(end < books.length);
            currentPage.current += 1;
            setIsLoading(false);
        }, 500);
    };

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
                    const allBooks = response.data.data || [];
                    setBooks(allBooks);
                    setDisplayedBooks(allBooks.slice(0, INITIAL_LOAD));
                    setHasMore(allBooks.length > INITIAL_LOAD);
                    currentPage.current = 0;
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
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
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

            <div className="space-y-4">
                {displayedBooks.map(book => (
                    <BookRow
                        key={book.work_id}
                        book={book}
                        isActive={activeRow === book.work_id}
                        onRowClick={handleRowClick}
                        renderActions={(book) => (
                            <BookRowModal
                                handleSpecificRankClick={handleSpecificRankClick}
                                handleReRankClick={handleReRankClick}
                                handleRemoveClick={handleRemoveClick}
                                book={book}
                            />
                        )}
                    />
                ))}
            </div>

            <div 
                ref={loadingRef} 
                className="w-full flex justify-center py-4"
            >
                {isLoading && (
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                )}
            </div>

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