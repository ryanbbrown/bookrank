import React from 'react';
import { Book, TBRBook, UserBook } from '../types/types'

interface CompareModalProps {
  handleComparisonClick: (value: number) => void
  exitFunction?: () => void
  selectedBook: Book
  comparedBook: UserBook
}

export function CompareModal({ 
  handleComparisonClick, 
  exitFunction, 
  selectedBook, 
  comparedBook 
}: CompareModalProps): JSX.Element {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="relative bg-white rounded-lg p-6 opacity w-1/2">
                <h2 className="text-center font-bold text-3xl mb-5">Which book was better?</h2>
                {exitFunction && (
                    <button
                        className="absolute top-2 right-2 w-8 h-8 text-black rounded flex items-center justify-center"
                        onClick={exitFunction}
                        aria-label="Close comparison"
                    >
                        <i className="fas fa-times" />
                    </button>
                )}
                <div className="flex justify-around w-full mb-4">
                    <div 
                      className="w-2/5 p-4 bg-gray-200 hover:bg-gray-300 rounded cursor-pointer" 
                      onClick={() => handleComparisonClick(1)}
                    >
                        <img 
                          src={selectedBook.image_url} 
                          alt={selectedBook.title}
                          className="mx-auto mb-4 rounded" 
                        />
                        <h2 className="text-lg text-center font-bold">{selectedBook.title}</h2>
                        <p className="text-center">{selectedBook.author}</p>
                    </div>
                    <div 
                      className="w-2/5 p-4 bg-gray-200 hover:bg-gray-300 rounded cursor-pointer" 
                      onClick={() => handleComparisonClick(0)}
                    >
                        <img 
                          src={comparedBook.image_url} 
                          alt={comparedBook.title}
                          className="mx-auto mb-4 rounded" 
                        />
                        <h2 className="text-lg text-center font-bold">{comparedBook.title}</h2>
                        <p className="text-center">{comparedBook.author}</p>
                        <p className="text-center mt-2">{comparedBook.normalized_rating}</p>
                    </div>
                </div>
                <div className="flex justify-center gap-4">
                    <button
                        className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded mt-5"
                        onClick={() => handleComparisonClick(0.5)}
                    >
                        I like both equally
                    </button>
                    <button
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mt-5"
                        onClick={() => handleComparisonClick(-1)}
                    >
                        Books aren't comparable
                    </button>
                </div>
            </div>
        </div>
    )
} 