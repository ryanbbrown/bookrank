import React from 'react';
import { UserBook, BookStatus, Book } from '../types/types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MoreHorizontal } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface BookRowProps {
    book: UserBook | Book;
    is_search_result?: boolean;
    onMarkAsRead?: (book: UserBook) => void;
    onMarkAsTBR?: (book: UserBook) => void;
    onMarkAsCurrentlyReading?: (book: UserBook) => void;
    onRank?: (book: UserBook) => void;
    onReRank?: (book: UserBook) => void;
    onRemove?: (book: UserBook) => void;
    onClick?: () => void;
}

export function BookRow({ 
    book, 
    is_search_result,
    onClick,
    ...props  // Keep all other props
}: BookRowProps): JSX.Element {
    const getDropdownItems = () => {
        if (is_search_result || !('status' in book)) return [];

        const userBook = book as UserBook;
        const items = [];

        // Primary actions (Mark as Read/Rank/Re-Rank)
        if (userBook.status === BookStatus.TO_BE_READ && props.onMarkAsRead) {
            items.push(
                <DropdownMenuItem
                    key="mark-read"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (props.onMarkAsRead) {
                            props.onMarkAsRead(userBook);
                        }
                    }}
                >
                    Mark as Read
                </DropdownMenuItem>
            );
        } else if (userBook.status === BookStatus.READ) {
            if (userBook.is_ranked && props.onReRank) {
                items.push(
                    <DropdownMenuItem
                        key="re-rank"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (props.onReRank) {
                                props.onReRank(userBook);
                            }
                        }}
                    >
                        Re-Rank
                    </DropdownMenuItem>
                );
            } else if (props.onRank) {
                items.push(
                    <DropdownMenuItem
                        key="rank"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (props.onRank) {
                                props.onRank(userBook);
                            }
                        }}
                    >
                        Rank
                    </DropdownMenuItem>
                );
            }
        }

        // Mark as TBR option (only show if book is READ)
        if (userBook.status === BookStatus.READ && props.onMarkAsTBR) {
            items.push(
                <DropdownMenuItem
                    key="mark-tbr"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (props.onMarkAsTBR) {
                            props.onMarkAsTBR(userBook);
                        }
                    }}
                >
                    To Be Read
                </DropdownMenuItem>
            );
        }

        // Currently Reading option (always present)
        if (props.onMarkAsCurrentlyReading) {
            items.push(
                <DropdownMenuItem
                    key="currently-reading"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (props.onMarkAsCurrentlyReading) {
                            props.onMarkAsCurrentlyReading(userBook);
                        }
                    }}
                >
                    Currently Reading
                </DropdownMenuItem>
            );
        }

        // Remove option (always present)
        if (props.onRemove) {
            items.push(
                <DropdownMenuItem
                    key="remove"
                    className="text-red-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (props.onRemove) {
                            props.onRemove(userBook);
                        }
                    }}
                >
                    Remove
                </DropdownMenuItem>
            );
        }

        return items;
    };

    return (
        <Card 
            className="mb-4 cursor-pointer transition-none hover:bg-slate-50"
            onClick={onClick}
        >
            <div className="flex flex-col sm:flex-row p-4">
                <div className="flex sm:flex-shrink-0">
                    <img 
                        src={book.image_url} 
                        alt={book.title} 
                        className="w-24 h-auto rounded shadow-sm"
                    />
                    <div className="ml-6 flex-grow sm:hidden">
                        <h3 className="text-xl font-semibold mb-1">{book.title}</h3>
                        <p className="text-gray-600 mb-2">{book.author}</p>
                    </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 sm:flex-grow">
                    <div className="hidden sm:block">
                        <h3 className="text-xl font-semibold mb-1">{book.title}</h3>
                        <p className="text-gray-600 mb-2">{book.author}</p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                        {!is_search_result && 'status' in book && (
                            <div className="flex flex-wrap gap-2">
                                {book.normalized_rating && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                        Rating: {book.normalized_rating}
                                    </span>
                                )}
                                {book.status === BookStatus.READ && book.date_finished && (
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                        Finished: {new Date(book.date_finished).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex-1 flex flex-wrap gap-2 items-center">
                                <span className="bg-gray-100 px-2 py-1 rounded">{book.genre}</span>
                                <span className="bg-gray-100 px-2 py-1 rounded">{book.book_type}</span>
                                {!is_search_result && 'status' in book && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="ml-auto">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" side="top" sideOffset={5}>
                                            {getDropdownItems()}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
} 