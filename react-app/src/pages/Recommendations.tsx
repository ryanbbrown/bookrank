import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { Button } from '../components/ui/button';
import { ApiResponse, Book } from '../types/types';

function Recommendations() {
    const [recommendation, setRecommendation] = useState<Book | null>(null);

    const fetchRecommendation = () => {
        axiosInstance.get<ApiResponse<Book>>('api/recommendations')
            .then(response => {
                setRecommendation(response.data.data || null);
            });
    };

    useEffect(() => {
        fetchRecommendation();
    }, []);

    const handleYesClick = () => {
        if (!recommendation) return;

        const { work_id, title, author, image_url } = recommendation;

        axiosInstance.post<ApiResponse<never>>('api/to-be-read/', {
            work_id,
            title,
            author,
            image_url,
        })
        .then(() => {
            axiosInstance.patch<ApiResponse<never>>('api/recommendations/', { work_id })
                .then(() => {
                    fetchRecommendation();
                });
        });
    };

    const handleNoClick = () => {
        if (!recommendation) return;

        axiosInstance.patch<ApiResponse<never>>('api/recommendations/', { 
            work_id: recommendation.work_id 
        })
        .then(() => {
            fetchRecommendation();
        });
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-6 text-center">We think you might like...</h1>
            {recommendation && (
                <div className="bg-gray-100 p-6 rounded shadow-md text-center">
                    <img 
                        src={recommendation.image_url} 
                        alt={`Cover of ${recommendation.title}`}
                        className="mx-auto mb-4 rounded" 
                    />
                    <h2 className="text-2xl font-bold mb-4">{recommendation.title}</h2>
                    <h3 className="text-xl mb-4">{recommendation.author}</h3>
                    <p className="text-xs mb-4">{recommendation.description}</p>
                    <div className="flex justify-between mt-6">
                        <Button
                            onClick={handleNoClick}
                            variant="destructive"
                            className="w-1/5 h-12"
                        >
                            Not Interested
                        </Button>
                        <Button
                            onClick={handleYesClick}
                            variant="default"
                            className="w-1/5 h-12 bg-green-500 hover:bg-green-600"
                        >
                            Add to TBR
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Recommendations; 