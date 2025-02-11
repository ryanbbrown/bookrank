import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { Button } from '../components/ui/button';
import { ApiResponse, Book, BookStatus } from '../types/types';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { useState as useExpandState } from 'react';

function Recommendations() {
    const queryClient = useQueryClient();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useExpandState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

    const { data: recommendations = [], isLoading, isFetching } = useQuery({
        queryKey: ['recommendations'],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<Array<Book & { reference_book: Book }>>>('api/recommendations/');
            return response.data.data || [];
        },
        refetchOnWindowFocus: false,
        staleTime: 0,
    });

    const currentRecommendation = recommendations[currentIndex];
    const remainingCount = recommendations.length - currentIndex;

    // Function to handle moving to next recommendation
    const moveToNext = async (currentWorkId: string, isLastItem: boolean) => {
        const newIndex = currentIndex + 1;
        // If we've reached the end of our recommendations
        if (isLastItem) {
            // Wait for the "mark as viewed" mutation to complete first
            await markAsViewedMutation.mutateAsync(currentWorkId);
            // Then fetch new recommendations
            await queryClient.refetchQueries({ queryKey: ['recommendations'] });
            setCurrentIndex(0);
        } else {
            setCurrentIndex(newIndex);
            // Fire mutation but don't wait for it
            markAsViewedMutation.mutate(currentWorkId);
        }
    };

    const markAsViewedMutation = useMutation({
        mutationFn: async (work_id: string) => {
            return axiosInstance.patch<ApiResponse<never>>('api/recommendations/', { work_id });
        }
    });

    const addToTBRMutation = useMutation({
        mutationFn: async (book: Book) => {
            return axiosInstance.post<ApiResponse<never>>('api/userbooks/', {
                work_id: book.work_id,
                status: BookStatus.TO_BE_READ
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const deleteSimilarMutation = useMutation({
        mutationFn: async (work_id: string) => {
            return axiosInstance.delete<ApiResponse<never>>('api/recommendations/', { 
                data: { work_id } 
            });
        }
    });

    const handleYesClick = async () => {
        if (!currentRecommendation) return;
        setSlideDirection('right');
        setTimeout(async () => {
            const { reference_book, ...bookData } = currentRecommendation;
            const isLastItem = currentIndex === recommendations.length - 1;
            await moveToNext(currentRecommendation.work_id, isLastItem);
            addToTBRMutation.mutate(bookData);
            setSlideDirection(null);
        }, 300); // match duration with CSS transition
    };

    const handleNoClick = async () => {
        if (!currentRecommendation) return;
        setSlideDirection('left');
        setTimeout(async () => {
            const isLastItem = currentIndex === recommendations.length - 1;
            await moveToNext(currentRecommendation.work_id, isLastItem);
            deleteSimilarMutation.mutate(currentRecommendation.work_id);
            setSlideDirection(null);
        }, 300);
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            {/* <h1 className="text-4xl font-bold mb-6 text-center">We think you might like...</h1> */}
            
            
            {(isLoading || isFetching) ? (
                <div className="flex justify-center items-center h-96">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
                </div>
            ) : currentRecommendation && (
                <>
                    {currentRecommendation.reference_book && (
                        <p className="text-center text-gray-600 mb-6">
                            Because you read <span className="font-bold">{currentRecommendation.reference_book.title}</span> by <span className="font-bold">{currentRecommendation.reference_book.author}</span>
                        </p>
                    )}
                    <Card className={`transition-all duration-300 ${
                        slideDirection === 'left' 
                            ? 'translate-x-[-20%] -rotate-12 opacity-0' 
                            : slideDirection === 'right' 
                            ? 'translate-x-[20%] rotate-12 opacity-0' 
                            : ''
                    }`}>
                        <CardContent className="p-6">
                            <img 
                                src={currentRecommendation.image_url} 
                                alt={`Cover of ${currentRecommendation.title}`}
                                className="mx-auto mb-4 rounded h-40 sm:h-64 object-contain" 
                            />
                            <h2 className="text-lg sm:text-2xl font-bold mb-4 text-center">{currentRecommendation.title}</h2>
                            <h3 className="text-md sm:text-xl mb-4 text-center">{currentRecommendation.author}</h3>
                            {currentRecommendation.description && (
                                <div className="relative">
                                    <p className={`text-sm ${isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}>
                                        {isExpanded 
                                            ? currentRecommendation.description 
                                            : currentRecommendation.description.slice(0, 200)}
                                        {!isExpanded && currentRecommendation.description.length > 200 && (
                                            <span 
                                                className="inline-block px-3 py-1 bg-gray-100 rounded-full text-blue-500 cursor-pointer ml-1 hover:bg-gray-200" 
                                                onClick={() => setIsExpanded(true)}
                                            >
                                                ...
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="justify-between p-6 pt-2 sm:p-6">
                            <Button
                                onClick={handleNoClick}
                                variant="destructive"
                                className="w-1/3 sm:w-1/5 h-12 rounded-xl"
                                disabled={markAsViewedMutation.isPending}
                            >
                                Skip
                            </Button>
                            <Button
                                onClick={handleYesClick}
                                variant="default"
                                className="w-1/3 sm:w-1/5 h-12 bg-green-500 hover:bg-green-600 rounded-xl"
                                disabled={addToTBRMutation.isPending}
                            >
                                Add to TBR
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}
            {remainingCount > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-small p-2 my-4 rounded">
                    <p>React to {remainingCount} more to refresh recommendations</p>
                </div>
            )}
        </div>
    );
}

export default Recommendations; 