import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { ApiResponse, UserAccount } from '../types/types';
import StatCard from '../components/StatCard';
import TopRecommendation from '../components/TopRecommendation';
import RecentFavorite from '../components/RecentFavorite';
import BookChart from '../components/BookChart';
import RatingChart from '../components/RatingChart';

function Dashboard(): JSX.Element {
    const { data: userData, isLoading: isLoadingBooks } = useQuery({
        queryKey: ['userData'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<UserAccount>>('api/user/');
            return response.data.data;
        }
    });

    const { data: recCount = 0, isLoading: isLoadingRecs } = useQuery({
        queryKey: ['recommendation-count'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<number>>('api/recommendations/count/');
            return response.data.data;
        },
        refetchOnWindowFocus: false,
    });

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3">
            <h1 className="text-4xl font-bold mb-6 text-center">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="grid grid-cols-2 md:flex md:flex-col gap-4 h-full">
                    <StatCard 
                        number={userData?.total_ranked_books_count ?? 0} 
                        label="books in library"
                        type="books"
                        isLoading={isLoadingBooks}
                    />
                    <StatCard 
                        number={recCount} 
                        label="recommendations viewed"
                        isLoading={isLoadingRecs}
                    />
                </div>
                <TopRecommendation />
                <RecentFavorite />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <BookChart />
                <RatingChart />
            </div>
        </div>
    );
}

export default Dashboard; 