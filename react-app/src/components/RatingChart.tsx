import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse, UserBook, BookStatus } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function RatingChart() {
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

    // Create histogram data for normalized ratings
    const ratingCounts = Array(10).fill(0); // 0-9 for normalized ratings
    booksData?.forEach(book => {
        if (book.normalized_rating !== null) {
            const rating = Math.floor(book.normalized_rating);
            if (rating >= 0 && rating < 10) {
                ratingCounts[rating]++;
            }
        }
    });

    const histogramData = ratingCounts.map((count, index) => ({
        rating: index.toString(),
        count: count
    }));

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center text-xl">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={histogramData}
                            margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="rating" 
                                tick={{ fontSize: 12 }}
                                label={{ 
                                    value: 'Rating', 
                                    position: 'bottom',
                                    offset: 0
                                }}
                            />
                            <YAxis 
                                label={{ 
                                    value: '# of books', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    style: { textAnchor: 'middle' }
                                }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    padding: '8px'
                                }}
                                cursor={{ fill: 'rgba(14, 116, 144, 0.1)' }}
                                formatter={(value: number) => [`${value} book${value === 1 ? '' : 's'}`, 'Count']}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="rgb(14 116 144)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export default RatingChart; 