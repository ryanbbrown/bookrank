import { TBRBook } from '../types/types'
import React from 'react';

interface BookRowModalProps<T extends TBRBook> {
    handleSpecificRankClick: (book: T) => void
    handleReRankClick?: (book: T) => void
    handleRemoveClick: (book: T) => void
    book: T
  }
  
  export function BookRowModal<T extends TBRBook>({ 
    handleSpecificRankClick, 
    handleReRankClick, 
    handleRemoveClick, 
    book 
  }: BookRowModalProps<T>): JSX.Element {
    return (
        <div className="flex flex-col absolute top-0 right-0 transform translate-x-full p-2 bg-white rounded shadow-lg z-10">
            {!book.is_ranked && (
                <button
                    className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded"
                    onClick={() => handleSpecificRankClick(book)}
                >
                    Rank
                </button>
            )}
            {book.is_ranked && handleReRankClick && (
                <button
                    className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded"
                    onClick={() => handleReRankClick(book)}
                >
                    Re-rank
                </button>
            )}
            <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mt-2"
                onClick={() => handleRemoveClick(book)}
            >
                Remove
            </button>
        </div>
    )
} 