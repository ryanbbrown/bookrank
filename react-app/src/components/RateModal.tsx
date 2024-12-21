import React from 'react';
import { Book, Rating } from '../types/types'

interface RateModalProps {
  onClickFunction?: (rating: Rating) => void
  exitFunction: () => void
  addTBRFunction?: () => void
  book: Book
}

export function RateModal({ 
  onClickFunction, 
  exitFunction, 
  addTBRFunction, 
  book 
}: RateModalProps): JSX.Element {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="relative bg-white rounded-lg p-6 w-1/2 text-center">
                {onClickFunction && (
                    <h2 className="text-center font-bold text-3xl mb-5">How was it?</h2>
                )}
                <button
                    className="absolute top-2 right-2 w-8 h-8 text-black rounded flex items-center justify-center"
                    onClick={exitFunction}
                    aria-label="Close rating modal"
                >
                    <i className="fas fa-times" />
                </button>
                <img 
                  src={book.image_url} 
                  alt={book.title}
                  className="mb-4 mx-auto rounded" 
                />
                <h2 className="text-lg text-center font-bold mb-1">{book.title}</h2>
                <p className="text-center mb-2">{book.author}</p>
                <p className="mb-4 text-xs text-center">{book.description}</p>
                {onClickFunction && (
                    <div className="flex justify-around mt-4">
                        <button 
                          className="bg-emerald-400 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg w-1/4" 
                          onClick={() => onClickFunction('high')}
                        >
                            I liked it
                        </button>
                        <button 
                          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg w-1/4" 
                          onClick={() => onClickFunction('medium')}
                        >
                            It was okay
                        </button>
                        <button 
                          className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg w-1/4" 
                          onClick={() => onClickFunction('low')}
                        >
                            I didn't like it
                        </button>
                    </div>
                )}
                {addTBRFunction && (
                    <div className="flex flex-row justify-center mt-10 items-center">
                        <p>Haven't read yet?</p>
                        <button 
                          className="ml-2 p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg" 
                          onClick={addTBRFunction}
                        >
                            Add to TBR
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
} 