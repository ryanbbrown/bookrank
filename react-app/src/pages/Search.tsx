import React, { useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { ApiResponse, UserBook, Rating, Book } from '../types/types';

interface SearchResult {
    book: Book;
    in_library: boolean;
    in_tbr: boolean;
}

function Search() {
    const [searchResults, setSearchResults] = useState<Array<SearchResult>>([]);
    const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null);
    const [showSearchedBook, setShowSearchedBook] = useState(false);
    const [comparedBook, setComparedBook] = useState<UserBook | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [query, setQuery] = useState('');

    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchInputRef.current?.value) return;

        try {
            const response = await axiosInstance.get<ApiResponse<Array<SearchResult>>>('api/search/', { 
                params: { query: searchInputRef.current.value } 
            });
            
            if (response.data.success && response.data.data) {
                setSearchResults(response.data.data);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleRowClick = (searchResult: SearchResult) => {
        setSelectedSearchResult(searchResult);
        setShowSearchedBook(true);
    };

    const handleAddFinishedBook = (rating: Rating) => {
        if (!selectedSearchResult) return;

        const { work_id, title, author } = selectedSearchResult.book;
        
        // Create a chain of promises
        const promises = [];
        
        // If book is in TBR, remove it first
        if (selectedSearchResult.in_tbr) {
            promises.push(
                axiosInstance.delete<ApiResponse<never>>(`api/to-be-read/${work_id}/`)
            );
        }

        // Add the book to user's library
        promises.push(
            axiosInstance.post<ApiResponse<never>>('api/userbooks/', {
                work_id,
                title,
                author,
                rating,
            })
        );

        // Execute all promises in sequence
        Promise.all(promises)
            .then(() => {
                if (searchInputRef.current) searchInputRef.current.value = '';
                setSearchResults([]);
                setShowSearchedBook(false);
                
                if (rating === 'high') {
                    axiosInstance.post<ApiResponse<never>>('api/recommendations/', {
                        work_id
                    });
                }
                
                axiosInstance.get<ApiResponse<UserBook>>('api/compare-book/', {
                    params: { work_id }
                }).then(response => {
                    const tempComparedBook = response.data.data || null;
                    if (tempComparedBook) {
                        setComparedBook(tempComparedBook);
                        setShowComparison(true);
                    }
                });
            })
            .catch(error => {
                console.error('Error adding book:', error);
            });
    };

    const handleAddTBR = () => {
        if (!selectedSearchResult) return;

        const { work_id, title, author, image_url } = selectedSearchResult.book;
        
        axiosInstance.post<ApiResponse<never>>('api/to-be-read/', {
            work_id,
            title,
            author,
            image_url,
        })
        .then(() => {
            if (searchInputRef.current) searchInputRef.current.value = '';
            setSearchResults([]);
            setShowSearchedBook(false);
        });
    };

    const fetchComparison = (workId: string) => {
        axiosInstance.get<ApiResponse<UserBook>>('api/compare-book/', {
            params: { work_id: workId }
        })
        .then(response => {
            const tempComparedBook = response.data.data || null;
            if (tempComparedBook) {
                setComparedBook(tempComparedBook);
                setShowComparison(true);
            } else {
                setShowComparison(false);
            }
        });
    };

    const handleComparisonClick = (o: number) => {
        if (!selectedSearchResult || !comparedBook) return;
        
        axiosInstance.post<ApiResponse<never>>('api/compare-book/', {
            new_book_id: selectedSearchResult.book.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: o,
        }).then(() => {
            fetchComparison(selectedSearchResult.book.work_id);
        });
    };

    return (
        <div className="search-page container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2 gap-4">
            <h1 className="text-4xl font-bold mb-4 text-center">Search</h1>
            <div className="w-full flex flex-col items-center justify-center">
                <form onSubmit={handleSearch} className="flex w-2/3">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for a book title or author"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-grow p-2 pl-10 text-sm text-black rounded-l bg-gray-200 outline-none"
                    />
                    <button
                        type="submit"
                        className="p-2 text-sm bg-gray-200 rounded-r flex items-center justify-center"
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>
            <div className="search-results">
                {searchResults.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-4 py-2 text-center text-lg rounded-l">Cover</th>
                                <th className="px-4 py-2 text-center text-lg">Title</th>
                                <th className="px-4 py-2 text-center text-lg">Author</th>
                                <th className="px-4 py-2 text-center text-lg">Avg Rating</th>
                                <th className="px-4 py-2 text-center text-lg rounded-r"># Ratings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchResults.map((searchResult) => (
                                <tr 
                                    key={searchResult.book.work_id} 
                                    onClick={() => handleRowClick(searchResult)} 
                                    className="hover:bg-gray-100"
                                >
                                    <td className="px-4 py-2 text-center rounded-l">
                                        <img src={searchResult.book.image_url} alt={searchResult.book.title} className="inline-block rounded" />
                                    </td>
                                    <td className="text-center">{searchResult.book.title}</td>
                                    <td className="text-center">{searchResult.book.author}</td>
                                    <td className="text-center">
                                        {searchResult.book.average_rating ? searchResult.book.average_rating.toFixed(2) : '—'}
                                    </td>
                                    <td className="text-center rounded-r">
                                        {searchResult.book.ratings_count.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {selectedSearchResult && showSearchedBook && (
                    <RateModal
                        onClickFunction={handleAddFinishedBook}
                        exitFunction={() => setShowSearchedBook(false)}
                        addTBRFunction={handleAddTBR}
                        book={selectedSearchResult.book}
                        status={(() => {
                            if (selectedSearchResult.in_library && selectedSearchResult.in_tbr) {
                                console.error("Book cannot be in both library and TBR");
                                return "SHOW_RATE_BUTTONS";
                            }
                            
                            if (selectedSearchResult.in_library) return "SHOW_IN_LIBRARY";
                            if (selectedSearchResult.in_tbr) return "SHOW_IN_TBR";
                            return "SHOW_RATE_BUTTONS";
                        })()}
                    />
                )}
                
                {showComparison && selectedSearchResult && comparedBook && (
                    <CompareModal
                        handleComparisonClick={handleComparisonClick}
                        selectedBook={selectedSearchResult.book}
                        comparedBook={comparedBook}
                        exitFunction={() => setShowComparison(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default Search; 