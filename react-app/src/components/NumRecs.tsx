import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

function NumRecs() {
    const { data: count = 0, isLoading } = useQuery({
        queryKey: ['recommendation-count'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<number>>('api/recommendations/count/');
            return response.data.data;
        },
        refetchOnWindowFocus: false,
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

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <div className="text-center space-y-2">
                    <p className="text-4xl font-bold text-teal-800">{count}</p>
                    <p className="text-slate-600">recommendations viewed</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default NumRecs; 