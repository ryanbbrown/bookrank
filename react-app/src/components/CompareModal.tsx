import React from 'react';
import { Book, UserBook } from '../types/types';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface CompareModalProps {
    handleComparisonClick: (value: number) => void
    exitFunction?: () => void
    selectedBook: Book | UserBook
    comparedBook: UserBook | null | undefined
    isLoading?: boolean
}

export function CompareModal({ 
    handleComparisonClick, 
    exitFunction, 
    selectedBook, 
    comparedBook,
    isLoading = false
}: CompareModalProps): JSX.Element {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <Card className="relative w-[95%] sm:w-1/2">
                {exitFunction && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 z-10"
                        onClick={exitFunction}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
                
                {isLoading || !comparedBook ? (
                    <CardContent className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle className="text-center">
                                Which book was better?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-6">
                            <div className="flex justify-between sm:justify-around w-full mb-4">
                                <Card 
                                    className="w-1/2 sm:w-2/5 cursor-pointer" 
                                    onClick={() => handleComparisonClick(1)}
                                >
                                    <CardContent className="p-4 text-center">
                                        <img 
                                            src={selectedBook.image_url} 
                                            alt={selectedBook.title}
                                            className="mx-auto mb-4 rounded shadow-sm" 
                                        />
                                        <h2 className="text-md font-semibold">{selectedBook.title}</h2>
                                        <p className="text-gray-600">{selectedBook.author}</p>
                                        {/* <p className="text-sm text-gray-500">{selectedBook.book_type}, {selectedBook.genre}</p> */}
                                    </CardContent>
                                </Card>

                                {comparedBook && (
                                    <Card 
                                        className="w-[48%] sm:w-2/5 cursor-pointer" 
                                        onClick={() => handleComparisonClick(0)}
                                    >
                                        <CardContent className="p-4 text-center">
                                            <img 
                                                src={comparedBook.image_url} 
                                                alt={comparedBook.title}
                                                className="mx-auto mb-4 rounded shadow-sm" 
                                            />
                                            <h2 className="text-md font-semibold">{comparedBook.title}</h2>
                                            <p className="text-gray-600">{comparedBook.author}</p>
                                            <p className="text-sm text-gray-500 mt-2">{comparedBook.normalized_rating}</p>
                                            {/* <p className="text-sm text-gray-500">{comparedBook.book_type}, {comparedBook.genre}</p> */}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                            <div className="flex justify-center gap-4">
                                <Button
                                    variant="default"
                                    className="bg-teal-800 hover:bg-teal-900"
                                    onClick={() => handleComparisonClick(0.5)}
                                >
                                    I like both
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleComparisonClick(-1)}
                                >
                                    Not comparable
                                </Button>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
} 