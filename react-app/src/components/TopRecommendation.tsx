import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse, Book } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Link } from 'react-router-dom';

function truncateTitle(title: string, maxLength = 25) {
    return title.length > maxLength ? `${title.slice(0, maxLength)}...` : title;
}

function TopRecommendation() {
    const { data: recommendations = [], isLoading } = useQuery({
        queryKey: ['recommendations'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<Array<Book & { reference_book: Book }>>>('api/recommendations/');
            return response.data.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 0,
    });

    const topRecommendation = recommendations[0];

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

    if (!topRecommendation) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center text-xl">Today's Top Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-slate-600">
                        <p>No recommendations yet!</p>
                        <p className="mt-2">
                            <Link to="/mybooks/read" className="text-teal-800 underline hover:text-teal-900">
                                Rate some books
                            </Link>
                            {' '}to get started
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center text-xl">Today's Top Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center">
                    <img 
                        src={topRecommendation.image_url} 
                        alt={`Cover of ${topRecommendation.title}`}
                        className="mx-auto mb-4 h-48 object-contain rounded shadow-sm" 
                    />
                    <h3 className="font-semibold text-lg mb-1">{truncateTitle(topRecommendation.title)}</h3>
                    <p className="text-slate-600">{topRecommendation.author}</p>
                    <Link 
                        to="/myrecs" 
                        className="inline-block mt-4 text-teal-800 underline hover:text-teal-900"
                    >
                        See all recommendations
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export default TopRecommendation; 