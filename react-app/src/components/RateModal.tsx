import React from "react";
import { Book, Bucket, UserBook } from "../types/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface RateModalProps {
    onClickFunction?: (bucket: Bucket) => void;
    exitFunction: () => void;
    addTBRFunction?: () => void;
    book: Book | UserBook;
    status: "SHOW_RATE_BUTTONS" | "SHOW_IN_LIBRARY" | "SHOW_IN_TBR";
    isLoading?: boolean;
}

export function RateModal({
    onClickFunction,
    exitFunction,
    addTBRFunction,
    book,
    status,
    isLoading = false,
}: RateModalProps): JSX.Element {

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <Card className="relative w-1/2 shadow-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 z-10"
                    onClick={exitFunction}
                >
                    <X className="h-4 w-4" />
                </Button>

                {isLoading ? (
                    <CardContent className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle className="text-center">
                                {status === "SHOW_IN_LIBRARY" 
                                    ? "You've read this book!"
                                    : "How was it?"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <img
                                    src={book.image_url}
                                    alt={book.title}
                                    className="mb-4 mx-auto rounded shadow-sm"
                                />
                                <h2 className="text-lg font-semibold mb-1">{book.title}</h2>
                                <p className="text-gray-600 mb-2">{book.author}</p>
                                <p className="text-sm text-gray-500">{book.description}</p>
                            </div>
                            
                            {status === "SHOW_IN_LIBRARY" ? (
                                <div className="text-center text-gray-600">
                                    <p>This book is in your library</p>
                                </div>
                            ) : (
                                <>
                                    {onClickFunction && (
                                        <div className="flex justify-around gap-4">
                                            <Button
                                                className="bg-emerald-400 hover:bg-emerald-500 w-1/3"
                                                onClick={() => onClickFunction("high")}
                                            >
                                                I liked it
                                            </Button>
                                            <Button
                                                className="bg-yellow-400 hover:bg-yellow-500 w-1/3"
                                                onClick={() => onClickFunction("medium")}
                                            >
                                                It was okay
                                            </Button>
                                            <Button
                                                className="bg-red-400 hover:bg-red-500 w-1/3"
                                                onClick={() => onClickFunction("low")}
                                            >
                                                I didn't like it
                                            </Button>
                                        </div>
                                    )}
                                    {status === "SHOW_IN_TBR" ? (
                                        <div className="text-center text-gray-600">
                                            <p>This book is in your TBR list</p>
                                        </div>
                                    ) : addTBRFunction && (
                                        <div className="flex justify-center items-center gap-2">
                                            <p className="text-gray-600">Haven't read yet?</p>
                                            <Button
                                                variant="secondary"
                                                onClick={addTBRFunction}
                                            >
                                                Add to TBR
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
