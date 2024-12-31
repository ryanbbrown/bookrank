import { UserBook } from '../types/types'
import React from 'react';

interface BookRowModalProps {
    handleSpecificRankClick: (book: UserBook) => void
    handleReRankClick?: (book: UserBook) => void
    handleRemoveClick: (book: UserBook) => void
    book: UserBook
}

export function BookRowModal({ 
    handleSpecificRankClick, 
    handleReRankClick, 
    handleRemoveClick, 
    book
}: BookRowModalProps): JSX.Element {
    const getButtonText = () => {
        if (book.status === 'read') {
            return book.is_ranked ? "Re-Rank" : "Rank";
        }
        return "Mark as Read";
    };

    return (
        <div className="flex flex-col absolute top-0 right-0 transform translate-x-full p-2 bg-white rounded shadow-lg z-10">
            {/* If it's a read book and ranked, show Re-Rank button only if handleReRankClick exists */}
            {(book.status === 'read' && book.is_ranked && handleReRankClick) ? (
                <button
                    className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded"
                    onClick={() => handleReRankClick(book)}
                >
                    {getButtonText()}
                </button>
            ) : (
                <button
                    className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded"
                    onClick={() => handleSpecificRankClick(book)}
                >
                    {getButtonText()}
                </button>
            )}
            <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mt-2"
                onClick={() => handleRemoveClick(book)}
            >
                Remove
            </button>
        </div>
    );
} 