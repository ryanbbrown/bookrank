import React from 'react';
import { UserBook } from '../types/types';
import { Card } from './ui/card';

interface BookRowProps {
    book: UserBook;
    isActive: boolean;
    onRowClick: (workId: string) => void;
    renderActions: (book: UserBook) => React.ReactNode;
}

export function BookRow({ book, isActive, onRowClick, renderActions }: BookRowProps): JSX.Element {
    return (
        <Card 
            className={`mb-4 hover:bg-gray-50 cursor-pointer transition-colors ${isActive ? 'ring-2 ring-teal-800' : ''}`}
            onClick={() => onRowClick(book.work_id)}
        >
            <div className="flex p-4">
                <div className="flex-shrink-0">
                    <img 
                        src={book.image_url} 
                        alt={book.title} 
                        className="w-24 h-auto rounded shadow-sm"
                    />
                </div>
                <div className="ml-6 flex-grow relative">
                    <h3 className="text-xl font-semibold mb-1">{book.title}</h3>
                    <p className="text-gray-600 mb-2">{book.author}</p>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-2">
                            {book.normalized_rating && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                    Rating: {book.normalized_rating}
                                </span>
                            )}
                            <span className="bg-gray-100 px-2 py-1 rounded">
                                Added: {new Date(book.date_added).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">{book.genre}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{book.book_type}</span>
                        </div>
                    </div>
                    {isActive && (
                        <div className="absolute right-0 top-0">
                            {renderActions(book)}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
} 