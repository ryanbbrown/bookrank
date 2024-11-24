import React, { useState, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { Book, Rating } from '../types/book';

function Search() {
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [comparedBook, setComparedBook] = useState<Book | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [showSearchedBook, setShowSearchedBook] = useState(false);

    const outcome = useRef<number>(0);
    const searchForm = useRef<HTMLInputElement>(null);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchForm.current?.value) return;

        axiosInstance.get('api/search/', { params: { query: searchForm.current.value } })
            .then(response => {
                const searchbooklist = response.data.data;
                setBooks(searchbooklist);
            });
    };

    const handleRowClick = (book: Book) => {
        setSelectedBook(book);
        setShowSearchedBook(true);
    };

    const handleAddFinishedBook = (rating: Rating) => {
        if (!selectedBook) return;

        const { work_id, title, author } = selectedBook;
        
        axiosInstance.post('api/add-finished-book/', {
            work_id,
            title,
            author,
            rating,
        })
        .then(() => {
            if (searchForm.current) searchForm.current.value = '';
            setBooks([]);
            setShowSearchedBook(false);
            
            if (rating === 'high') {
                axiosInstance.post('api/add-recommendations/', {
                    work_id
                });
            }
            
            axiosInstance.get('api/compare-book/', {
                params: {
                    work_id,
                    title,
                    author,
                }
            }).then(response => {
                const comparedBook = response.data.data;
                setComparedBook(comparedBook);
                setShowComparison(true);
            });
        });
    };

    const handleAddTBR = () => {
        if (!selectedBook) return;

        const { work_id, title, author, image_url } = selectedBook;
        
        axiosInstance.post('api/to-be-read/', {
            work_id,
            title,
            author,
            image_url,
        })
        .then(() => {
            if (searchForm.current) searchForm.current.value = '';
            setBooks([]);
            setShowSearchedBook(false);
        });
    };

    const fetchComparison = (workId: string) => {
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
        });
    };

    const handleComparisonClick = (o: number) => {
        if (!selectedBook || !comparedBook) return;

        outcome.current = o;
        axiosInstance.post('api/compare-book/', {
            new_book_id: selectedBook.work_id,
            existing_book_id: comparedBook.work_id,
            outcome: outcome.current,
        }).then(() => {
            fetchComparison(selectedBook.work_id);
        });
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2 gap-4">
            <h1 className="text-4xl font-bold mb-4 text-center">Search</h1>
            <div className="w-full flex flex-col items-center justify-center">
                <form onSubmit={handleSearch} className="flex w-2/3">
                    <input
                        type="text"
                        ref={searchForm}
                        className="flex-grow p-2 pl-10 text-sm text-black rounded-l bg-gray-200 outline-none"
                        placeholder="Search for a book"
                    />
                    <button
                        type="submit"
                        className="p-2 text-sm bg-gray-200 rounded-r flex items-center justify-center"
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>

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
    );
}

export default Search; 