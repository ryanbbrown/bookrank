import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse, UserBook, BookStatus } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function BookChart() {
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

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const bookCountsByMonth = months.map((month, index) => ({
        name: month,
        books: booksData?.filter(book => {
            if (!book.date_finished) return false;
            const finishDate = new Date(book.date_finished);
            return finishDate.getFullYear() === currentYear && 
                   finishDate.getMonth() === index;
        }).length || 0
    }));

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center text-xl">Year in Books</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={bookCountsByMonth}
                            margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12 }}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={60}
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
                                formatter={(value: number) => [`${value} book${value === 1 ? '' : 's'}`, 'Read']}
                            />
                            <Bar 
                                dataKey="books" 
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

export default BookChart; 