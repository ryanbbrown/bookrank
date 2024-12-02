import React, { useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { ApiResponse, UserBook, Rating, Book } from '../types/types';

function Search() {
    const [books, setBooks] = useState<Array<Book>>([]);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [comparedBook, setComparedBook] = useState<UserBook | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showSearchedBook, setShowSearchedBook] = useState(false);
    const [query, setQuery] = useState('');

    const searchInputRef = useRef(null);

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchInputRef.current?.value) return;

        try {
            const response = await axiosInstance.get<ApiResponse<Array<Book>>>('api/search/', { 
                params: { query: searchInputRef.current.value } 
            });
            
            if (response.data.success && response.data.data) {
                setBooks(response.data.data);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleRowClick = (book: Book) => {
        setSelectedBook(book);
        setShowSearchedBook(true);
    };

    const handleAddFinishedBook = (rating: Rating) => {
        if (!selectedBook) return;

        const { work_id, title, author } = selectedBook;
        
        axiosInstance.post<ApiResponse<never>>('api/add-finished-book/', {
            work_id,
            title,
            author,
            rating,
        })
        .then(() => {
            if (searchInputRef.current) searchInputRef.current.value = '';
            setBooks([]);
            setShowSearchedBook(false);
            
            if (rating === 'high') {
                axiosInstance.post<ApiResponse<never>>('api/add-recommendations/', {
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
        });
    };

    const handleAddTBR = () => {
        if (!selectedBook) return;

        const { work_id, title, author, image_url } = selectedBook;
        
        axiosInstance.post<ApiResponse<never>>('api/to-be-read/', {
            work_id,
            title,
            author,
            image_url,
        })
        .then(() => {
            if (searchInputRef.current) searchInputRef.current.value = '';
            setBooks([]);
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
        if (!selectedBook || !comparedBook) return;

        axiosInstance.post<ApiResponse<never>>('api/compare-book/', {
            new_book_id: selectedBook.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: o,
        }).then(() => {
            fetchComparison(selectedBook.work_id);
        });
    };

    return (
        <div className="search-page">
            <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for books"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
            />
            <button onClick={handleSearch} className="search-button">Search</button>
            <div className="search-results">
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
                                <tr key={book.work_id} onClick={() => handleRowClick(book)} className="hover:bg-gray-100">
                                    <td className="px-4 py-2 text-center rounded-l">
                                        <img src={book.image_url} alt={book.title} className="inline-block rounded" />
                                    </td>
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
                
                {showComparison && selectedBook && comparedBook && (
                    <CompareModal
                        handleComparisonClick={handleComparisonClick}
                        selectedBook={selectedBook!} // the ! is to tell typescript that selectedBook is not null
                        comparedBook={comparedBook}
                        exitFunction={() => setShowComparison(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default Search; 