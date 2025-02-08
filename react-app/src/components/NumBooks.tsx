import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse, UserAccount } from '../types/types';
import { Card, CardContent } from './ui/card';

function NumBooks() {
    const { data: userData, isLoading } = useQuery({
        queryKey: ['userData'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<UserAccount>>('api/user/');
            return response.data.data;
        }
    });

    if (isLoading) {
        return (
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-24">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const numBooks = userData?.total_ranked_books_count ?? 0;

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <div className="text-center">
                    <div className="text-4xl font-bold text-teal-800">
                        {numBooks}
                    </div>
                    <div className="text-slate-600 mt-2">
                        books added
                    </div>
                    {numBooks < 10 && (
                        <div className="mt-4 text-sm text-slate-600">
                            Need a start? <Link to="/goodreadsimport" className="text-teal-800 underline hover:text-teal-900">Import from Goodreads</Link>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default NumBooks; 