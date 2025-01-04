import React, { useState, useEffect, useRef, useMemo } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { UserBook, Bucket, ApiResponse, UserAccount, BookStatus } from '../types/types';
import { BookRow } from '../components/BookRow';
import { Button } from "../components/ui/button";
import { MultiSelect } from '../components/ui/MultiSelect';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    const queryClient = useQueryClient();
    
    // State declarations
    const [sortField, setSortField] = useState<SortField>("normalized_rating");
    const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirections["normalized_rating"]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [selectedBookTypes, setSelectedBookTypes] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    
    // Other state for modals, etc.
    const [unrankedBook, setUnrankedBook] = useState<UserBook | null>(null);
    const [comparedBook, setComparedBook] = useState<UserBook | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [getNextUnranked, setGetNextUnranked] = useState(true);

    // useRef declarations
    const loadingRef = useRef<HTMLDivElement>(null);
    const INITIAL_LOAD = 20;
    const PER_PAGE = 10;

    // React Query hooks
    const { data: booksData, isLoading: isBooksLoading } = useQuery({
        queryKey: ['books', status],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/', {
                params: { status }
            });
            return response.data.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: userData, isLoading: isUserDataLoading } = useQuery({
        queryKey: ['userData'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<UserAccount>>('api/user/');
            return response.data.data || null;
        },
        enabled: status === BookStatus.READ
    });

    // Mutations
    const removeMutation = useMutation({
        mutationFn: (workId: string) => 
            axiosInstance.delete<ApiResponse<never>>(`api/userbooks/${workId}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const updateBookStatusMutation = useMutation({
        mutationFn: ({ workId, newStatus }: { workId: string, newStatus: BookStatus }) =>
            axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${workId}/`, {
                status: newStatus
            }),
        onSuccess: (_, { newStatus }) => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const updateBucketMutation = useMutation({
        mutationFn: ({ workId, bucket }: { workId: string, bucket: Bucket }) =>
            axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${workId}/`, {
                bucket: bucket,
            }),
        onSuccess: (_, variables) => {
            if (unrankedBook) {
                setUnrankedBook(prev => prev ? { ...prev, bucket: variables.bucket } : null);
                fetchComparison({ workId: variables.workId, getNextUnranked });
            }
        }
    });

    const compareBookMutation = useMutation({
        mutationFn: ({ newBookId, existingBookId, outcome }: { newBookId: string, existingBookId: string, outcome: number }) =>
            axiosInstance.post<ApiResponse<never>>('api/compare-book/', {
                new_book_id: newBookId,
                existing_book_id: existingBookId,
                outcome: outcome,
            }),
        onSuccess: (_, { outcome, newBookId }) => {
            if (outcome !== -1) {
                // only invalidate if the books were NOT marked as "not comparable"
                queryClient.invalidateQueries({ queryKey: ['books'] });
                queryClient.invalidateQueries({ queryKey: ['userData'] });
            }
            if (unrankedBook) {
                fetchComparison({ workId: newBookId, getNextUnranked });
            }
        }
    });

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
        let filtered = [...books];
        if (selectedGenres.length > 0) {
            filtered = filtered.filter(book => selectedGenres.includes(book.genre));
        }
        if (selectedBookTypes.length > 0) {
            filtered = filtered.filter(book => selectedBookTypes.includes(book.book_type));
        }
        return sortBooks(filtered, sortField, sortDirection);
    };

    // Derived state
    const filteredAndSortedBooks = useMemo(() => {
        if (!booksData) return [];
        return getFilteredAndSortedBooks(booksData);
    }, [booksData, selectedGenres, selectedBookTypes, sortField, sortDirection]);

    const displayedBooks = useMemo(() => {
        const start = 0;
        const end = INITIAL_LOAD + (currentPage * PER_PAGE);
        return filteredAndSortedBooks.slice(start, end);
    }, [filteredAndSortedBooks, currentPage]);

    const hasMore = filteredAndSortedBooks.length > displayedBooks.length;

    // useEffect to handle infinite scrolling
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMoreBooks();
                }
            },
            { threshold: 1.0 }
        );

        if (loadingRef.current) {
            observer.observe(loadingRef.current);
        }

        return () => {
            if (loadingRef.current) {
                observer.unobserve(loadingRef.current);
            }
        };
    }, [hasMore]);
    

    // Loading check
    if (isBooksLoading || (status === BookStatus.READ && isUserDataLoading)) {
        return (
            <div className="container mx-auto flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Handlers
    const loadMoreBooks = () => {
        if (hasMore) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Update handlers to use mutations
    const handleRemoveClick = (book: UserBook) => {
        removeMutation.mutate(book.work_id);
    };

    const handleMarkAsTBR = (book: UserBook) => {
        updateBookStatusMutation.mutate({ 
            workId: book.work_id, 
            newStatus: BookStatus.TO_BE_READ 
        });
    };

    const handleMarkAsCurrentlyReading = (book: UserBook) => {
        updateBookStatusMutation.mutate({ 
            workId: book.work_id, 
            newStatus: BookStatus.CURRENTLY_READING 
        });
    };

    const handleBucketClick = (bucket: Bucket) => {
        if (!unrankedBook) return;
        updateBucketMutation.mutate({ workId: unrankedBook.work_id, bucket });
    };

    const handleComparisonClick = (o: number) => {
        if (!unrankedBook || !comparedBook) return;
        compareBookMutation.mutate({
            newBookId: unrankedBook.work_id,
            existingBookId: comparedBook.work_id,
            outcome: o,
        });
    };

    // Filtering and Sorting Functions
    const getUniqueGenres = (books: UserBook[]): string[] => {
        return Array.from(new Set(books.map(book => book.genre))).sort();
    };

    const getUniqueBookTypes = (books: UserBook[]): string[] => {
        return Array.from(new Set(books.map(book => book.book_type))).sort();
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
    const handleMarkAsRead = (book: UserBook) => {
        setUnrankedBook(book);
        setShowComparison(true);
    };




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
                    options={getUniqueGenres(booksData || [])}
                    selectedOptions={selectedGenres}
                    onChange={handleGenreChange}
                    label="Filter Genres"
                />
                <MultiSelect
                    options={getUniqueBookTypes(booksData || [])}
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

            {status === BookStatus.READ && (userData?.total_ranked_books_count ?? 15) < 15 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                    <p>Rank {15 - (userData?.total_ranked_books_count ?? 15)} more books to see ratings!</p>
                </div>
            )}

            {status === BookStatus.READ && Array.isArray(booksData) && booksData.some(book => book.is_ranked === false) && (
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
                        onRank={status === BookStatus.READ ? handleSpecificRankClick : undefined}
                        onReRank={status === BookStatus.READ ? handleReRankClick : undefined}
                        onMarkAsTBR={status !== BookStatus.TO_BE_READ ? handleMarkAsTBR : undefined}
                        onMarkAsCurrentlyReading={handleMarkAsCurrentlyReading}
                        onRemove={handleRemoveClick}
                        onMarkAsRead={status === BookStatus.TO_BE_READ ? handleMarkAsRead : undefined}
                    />
                ))}
            </div>

            {hasMore && (
                <div ref={loadingRef} className="w-full flex justify-center py-4">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                </div>
            )}

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