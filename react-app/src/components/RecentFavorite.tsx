import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse, UserBook, BookStatus } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Link } from 'react-router-dom';

function truncateTitle(title: string, maxLength = 25) {
    return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
}

function RecentFavorite() {
    const { data: booksData, isLoading } = useQuery({
        queryKey: ['books', BookStatus.READ],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<Array<UserBook>>>('api/userbooks/', {
                params: { status: BookStatus.READ }
            });
            return response.data.data || [];
        },
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-48">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get the date one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Filter and sort books to find the highest rated recent book
    const recentFavorite = booksData
        ?.filter(book => {
            if (!book.date_finished || book.normalized_rating === null) return false;
            const finishDate = new Date(book.date_finished);
            return finishDate >= oneMonthAgo;
        })
        .sort((a, b) => {
            return (b.normalized_rating ?? 0) - (a.normalized_rating ?? 0);
        })[0];

    if (!recentFavorite) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center text-xl">Recent Favorite</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-slate-600">
                        <p>No rated books in the past month</p>
                        <p className="mt-2">
                            <Link to="/mybooks/read" className="text-teal-800 underline hover:text-teal-900">
                                Rate some books
                            </Link>
                            {' '}to see your favorites
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center text-xl">Recent Favorite</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center">
                    <img 
                        src={recentFavorite.image_url} 
                        alt={`Cover of ${recentFavorite.title}`}
                        className="mx-auto mb-4 h-48 object-contain rounded shadow-sm" 
                    />
                    <h3 className="font-semibold text-lg mb-1">{truncateTitle(recentFavorite.title)}</h3>
                    <p className="text-slate-600">{recentFavorite.author}</p>
                    <p className="text-sm text-slate-500 mt-2">
                        Rating: {typeof recentFavorite.normalized_rating === 'number' ? recentFavorite.normalized_rating.toFixed(1) : '—'}/10
                    </p>
                    <Link 
                        to="/mybooks/read" 
                        className="inline-block mt-4 text-teal-800 underline hover:text-teal-900"
                    >
                        See all rated books
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default RecentFavorite; 