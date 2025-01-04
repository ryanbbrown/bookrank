import React from 'react';
import { UserBook, BookStatus } from '../types/types';
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
    book: UserBook;
    onMarkAsRead?: (book: UserBook) => void;
    onMarkAsTBR?: (book: UserBook) => void;
    onMarkAsCurrentlyReading?: (book: UserBook) => void;
    onRank?: (book: UserBook) => void;
    onReRank?: (book: UserBook) => void;
    onRemove: (book: UserBook) => void;
}

export function BookRow({ 
    book, 
    onMarkAsRead,
    onMarkAsTBR,
    onMarkAsCurrentlyReading,
    onRank,
    onReRank,
    onRemove 
}: BookRowProps): JSX.Element {
    const getDropdownItems = () => {
        const items = [];

        // Primary actions (Mark as Read/Rank/Re-Rank)
        if (book.status === BookStatus.TO_BE_READ && onMarkAsRead) {
            items.push(
                <DropdownMenuItem
                    key="mark-read"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(book);
                    }}
                >
                    Mark as Read
                </DropdownMenuItem>
            );
        } else if (book.status === BookStatus.READ) {
            if (book.is_ranked && onReRank) {
                items.push(
                    <DropdownMenuItem
                        key="re-rank"
                        onClick={(e) => {
                            e.stopPropagation();
                            onReRank(book);
                        }}
                    >
                        Re-Rank
                    </DropdownMenuItem>
                );
            } else if (onRank) {
                items.push(
                    <DropdownMenuItem
                        key="rank"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRank(book);
                        }}
                    >
                        Rank
                    </DropdownMenuItem>
                );
            }
        }

        // Mark as TBR option (only show if book is READ)
        if (book.status === BookStatus.READ && onMarkAsTBR) {
            items.push(
                <DropdownMenuItem
                    key="mark-tbr"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsTBR(book);
                    }}
                >
                    To Be Read
                </DropdownMenuItem>
            );
        }

        // Currently Reading option (always present)
        if (onMarkAsCurrentlyReading) {
            items.push(
                <DropdownMenuItem
                    key="currently-reading"
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsCurrentlyReading(book);
                    }}
                >
                    Currently Reading
                </DropdownMenuItem>
            );
        }

        // Remove option (always present)
        items.push(
            <DropdownMenuItem
                key="remove"
                className="text-red-600"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(book);
                }}
            >
                Remove
            </DropdownMenuItem>
        );

        return items;
    };

    return (
        <Card 
            className="mb-4 cursor-pointer transition-none"
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
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">{book.title}</h3>
                            <p className="text-gray-600 mb-2">{book.author}</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {getDropdownItems()}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
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
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-gray-100 px-2 py-1 rounded">{book.genre}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{book.book_type}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
} 