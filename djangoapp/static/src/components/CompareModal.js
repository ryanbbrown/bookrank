import React from 'react';

const RateModal = ({ handleComparisonClick, exitFunction, selectedBook, comparedBook }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="relative bg-white rounded-lg p-6 opacity w-1/2">
                <h2 className="text-center font-bold text-3xl mb-5">Which book was better?</h2>
                {exitFunction !== undefined && (
                    <button
                        className="absolute top-2 right-2 w-8 h-8 text-black rounded flex items-center justify-center"
                        onClick={exitFunction}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                )}
                <div className="flex justify-around w-full mb-4">
                    <div className="w-2/5 p-4 bg-gray-200 hover:bg-gray-300 rounded" onClick={() => handleComparisonClick(1)}>
                        <img src={selectedBook.image_url} className="mx-auto mb-4 rounded" />
                        <h2 className="text-lg text-center font-bold">{selectedBook.title}</h2>
                        <p className="text-center">{selectedBook.author}</p>
                        {/* <p className="text-center">{selectedBook.normalized_rating}</p> */}
                    </div>
                    <div className="w-2/5 p-4 bg-gray-200 hover:bg-gray-300 rounded" onClick={() => handleComparisonClick(0)}>
                        <img src={comparedBook.image_url} className="mx-auto mb-4 rounded" />
                        <h2 className="text-lg text-center font-bold">{comparedBook.title}</h2>
                        <p className="text-center">{comparedBook.author}</p>
                        <p className="text-center mt-2">{comparedBook.normalized_rating}</p>
                    </div>
                </div>
                <div className="flex justify-center">
                    <button
                        className="bg-teal-800 hover:bg-teal-900 text-white px-4 py-2 rounded mt-5"
                        onClick={() => handleComparisonClick(0.5)}
                    >
                        I can't decide
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RateModal;