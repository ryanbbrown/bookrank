import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { UserBook, Bucket, ApiResponse, UserAccount, BookStatus } from '../types/types';
import { BookRow } from '../components/BookRow';
import { Button } from "../components/ui/button";
import { MultiSelect } from '../components/ui/MultiSelect';
import { useParams } from 'react-router-dom';

interface ComparisonParams {
    workId: string;
    getNextUnranked: boolean;
}

type SortField = "title" | "author" | "genre" | "book_type" | "normalized_rating";
type SortDirection = "asc" | "desc";

interface SortOption {
    field: SortField;
    label: string;
}

const sortOptions: SortOption[] = [
    { field: "normalized_rating", label: "Rating" },
    { field: "title", label: "Title" },
    { field: "author", label: "Author" },
    { field: "genre", label: "Genre" },
    { field: "book_type", label: "Book Type" },
];

const defaultSortDirections: Record<SortField, SortDirection> = {
    normalized_rating: "desc",
    title: "asc",
    author: "asc",
    genre: "asc",
    book_type: "asc"
};

function MyBooks() {
    const { status } = useParams<{ status: BookStatus }>();
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
    const [sortField, setSortField] = useState<SortField>("normalized_rating");
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirections["normalized_rating"]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedBookTypes, setSelectedBookTypes] = useState<string[]>([]);

    // Filtering and Sorting Functions
    const getUniqueGenres = (books: UserBook[]): string[] => {
        return Array.from(new Set(books.map(book => book.genre))).sort();
    };

    const getUniqueBookTypes = (books: UserBook[]): string[] => {
        return Array.from(new Set(books.map(book => book.book_type))).sort();
    };
    
    const sortBooks = (books: UserBook[], field: SortField, direction: SortDirection): UserBook[] => {
        return [...books].sort((a, b) => {
            const aValue = a[field];
            const bValue = b[field];

            if (aValue === null) return direction === "asc" ? -1 : 1;
            if (bValue === null) return direction === "asc" ? 1 : -1;

            const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return direction === "asc" ? comparison : -comparison;
        });
    };

    

    

    const getFilteredAndSortedBooks = (books: UserBook[]): UserBook[] => {
        let filtered = books;
        if (selectedGenres.length > 0) {
            filtered = filtered.filter(book => selectedGenres.includes(book.genre));
        }
        if (selectedBookTypes.length > 0) {
            filtered = filtered.filter(book => selectedBookTypes.includes(book.book_type));
        }
        return sortBooks(filtered, sortField, sortDirection);
    };

    const handleSortChange = (field: SortField) => {
        if (field !== sortField) {  // Only act if changing to a new field
            setSortField(field);
            const defaultDirection = defaultSortDirections[field];
            setSortDirection(defaultDirection);
        }
    };

    const handleGenreChange = (selected: string[]) => {
        setSelectedGenres(selected);
    };

    const handleBookTypeChange = (selected: string[]) => {
        setSelectedBookTypes(selected);
    };

    const handleClearFilters = () => {
        setSelectedGenres([]);
        setSelectedBookTypes([]);
    };

    // Add new effect to handle filtering and sorting
    useEffect(() => {
        // Skip if no books loaded yet
        if (books.length === 0) return;

        const filteredAndSortedBooks = getFilteredAndSortedBooks(books);
        setDisplayedBooks(filteredAndSortedBooks.slice(0, INITIAL_LOAD));
        setHasMore(filteredAndSortedBooks.length > INITIAL_LOAD);
        currentPage.current = 0;
    }, [selectedGenres, selectedBookTypes, sortField, sortDirection, books]);




    
    // Data Loading and Pagination Functions
    const loadMoreBooks = () => {
        if (books.length === 0) return;
        
        setIsLoading(true);
        const start = currentPage.current * PER_PAGE + INITIAL_LOAD;
        const end = start + PER_PAGE;
        
        setTimeout(() => {
            const filteredAndSortedBooks = getFilteredAndSortedBooks(books);
            const newBooks = filteredAndSortedBooks.slice(start, end);
            setDisplayedBooks(prev => [...prev, ...newBooks]);
            setHasMore(end < filteredAndSortedBooks.length);
            currentPage.current += 1;
            setIsLoading(false);
        }, 500);
    };

    const refreshBooks = () => {
        setTimeout(() => {
            axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/', {
                params: { status }
            })
                .then(response => {
                    const allBooks = response.data.data || [];
                    setBooks(allBooks);
                    setDisplayedBooks(allBooks.slice(0, INITIAL_LOAD));
                    setHasMore(allBooks.length > INITIAL_LOAD);
                    currentPage.current = 0;
                    if (status === BookStatus.READ) {
                        refreshUserData();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }, 500);
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





    // Book Ranking Functions
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

    const handleBucketClick = (bucket: Bucket) => {
        if (!unrankedBook) return;

        axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${unrankedBook.work_id}/`, {
            bucket: bucket,
        }).then(() => {
            setUnrankedBook(prevState => prevState ? {
                ...prevState,
                bucket: bucket
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
            if (o !== -1) { // we only refresh if the outcome actually resulted in bucket update
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
        if (book.bucket !== null) {
            fetchComparison({ workId: book.work_id, getNextUnranked: false });
        }
        setShowComparison(true);
    };

    const handleGeneralRankClick = () => {
        setGetNextUnranked(true);
        fetchUnrankedBook();
    };

    const handleReRankClick = (book: UserBook) => {
        const updatedBook = { ...book, bucket: null };
        setGetNextUnranked(false);
        setUnrankedBook(updatedBook);
        setShowComparison(true);
    };





    // Book Management Functions
    const handleRemoveClick = (book: UserBook) => {
        axiosInstance.delete<ApiResponse<never>>(`api/userbooks/${book.work_id}/`)
            .then(() => {
                refreshBooks();
            });
    };

    const handleRowClick = (bookId: string) => {
        setActiveRow(bookId === activeRow ? null : bookId);
    };

    const handleMarkAsTBR = (book: UserBook) => {
        axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${book.work_id}/`, {
            status: BookStatus.TO_BE_READ
        })
        .then(() => {
            refreshBooks();
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

    const handleMarkAsRead = (book: UserBook) => {
        setUnrankedBook(book);
        setShowComparison(true);
    };




    // Effects
    useEffect(() => {
        axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/', {
            params: { status }
        })
            .then(response => {
                const allBooks = response.data.data || [];
                const sortedBooks = sortBooks(allBooks, "normalized_rating", "desc");
                setBooks(sortedBooks);
                setDisplayedBooks(sortedBooks.slice(0, INITIAL_LOAD));
                setHasMore(sortedBooks.length > INITIAL_LOAD);
                currentPage.current = 0;
                if (status === BookStatus.READ) {
                    refreshUserData();
                }
            })
            .catch(error => {
                console.error('Error loading initial data:', error);
            });
    }, [status]);


    useEffect(() => {
        // Infinite scroll observer
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
    }, [hasMore, isLoading, displayedBooks]);

    

    // Determine the header text based on the status
    const getHeaderText = (status: BookStatus | undefined): string => {
        switch (status) {
            case BookStatus.READ:
                return "My Library";
            case BookStatus.TO_BE_READ:
                return "To Be Read";
            case BookStatus.CURRENTLY_READING:
                return "Currently Reading";
            default:
                return "My Books";
        }
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-6 text-center">{getHeaderText(status)}</h1>
            
            <div className="flex flex-wrap gap-4 mb-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sort by:</label>
                    <select
                        value={sortField}
                        onChange={(e) => handleSortChange(e.target.value as SortField)}
                        className="border rounded px-2 py-1"
                    >
                        {sortOptions.map(option => (
                            <option key={option.field} value={option.field}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                        }}
                        className="ml-2"
                    >
                        {sortDirection === "asc" ? "↑" : "↓"}
                    </Button>
                </div>
                <MultiSelect
                    options={getUniqueGenres(books)}
                    selectedOptions={selectedGenres}
                    onChange={handleGenreChange}
                    label="Filter Genres"
                />
                <MultiSelect
                    options={getUniqueBookTypes(books)}
                    selectedOptions={selectedBookTypes}
                    onChange={handleBookTypeChange}
                    label="Filter Book Types"
                />
                {(selectedGenres.length > 0 || selectedBookTypes.length > 0) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                        className="whitespace-nowrap"
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {status === BookStatus.READ && totalBooksRanked < 15 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                    <p>Rank {15 - totalBooksRanked} more books to see ratings!</p>
                </div>
            )}

            {status === BookStatus.READ && Array.isArray(books) && books.some(book => book.is_ranked === false) && (
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
                        onRank={status === BookStatus.READ ? handleSpecificRankClick : undefined}
                        onReRank={status === BookStatus.READ ? handleReRankClick : undefined}
                        onMarkAsTBR={status !== BookStatus.TO_BE_READ ? handleMarkAsTBR : undefined}
                        onMarkAsCurrentlyReading={handleMarkAsCurrentlyReading}
                        onRemove={handleRemoveClick}
                        onMarkAsRead={status === BookStatus.TO_BE_READ ? handleMarkAsRead : undefined}
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

            {unrankedBook && showComparison && unrankedBook.bucket === null && (
                <RateModal
                    onClickFunction={handleBucketClick}
                    exitFunction={() => setShowComparison(false)}
                    book={unrankedBook}
                    status="SHOW_RATE_BUTTONS"
                />
            )}

            {unrankedBook && showComparison && comparedBook && unrankedBook.bucket !== null && (
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