import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { ApiResponse, UserBook, Bucket, Book, BookStatus } from '../types/types';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BookRow } from '../components/BookRow';
import { Search as SearchIcon } from "lucide-react";
import { useBookComparison } from '../hooks/useBookComparison';

interface SearchResult {
    book: Book;
    in_library: boolean;
    in_tbr: boolean;
}

type RankingState = 
  | { type: 'idle' }
  | { type: 'rating'; search_result: SearchResult }
  | { type: 'comparing'; book: Book };

function Search() {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    // SEARCH
    const { data: searchResults = [], isLoading } = useQuery({
        queryKey: ['searchBooks', query],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<Array<SearchResult>>>('api/search/', { 
                params: { query } 
            });
            return response.data.data || [];
        },
        enabled: query.length > 0,
    });

    const [rankingState, setRankingState] = useState<RankingState>({ type: 'idle' });

    const { getComparisonMutation, handleComparisonClick: handleComparisonClickBase } = useBookComparison({
        onNoMoreComparisons: () => setRankingState({ type: 'idle' })
    });

    // Use an effect to trigger the mutation when entering comparing state
    useEffect(() => {
        if (rankingState.type === 'comparing') {
            getComparisonMutation.mutate(rankingState.book.work_id);
        }
    }, [rankingState.type]);

    const handleComparisonClick = (o: number) => {
        if (rankingState.type !== 'comparing' || !getComparisonMutation.data) return;
        handleComparisonClickBase(
            rankingState.book.work_id,
            getComparisonMutation.data.work_id,
            o
        );
    };

    // ADD FINISHED BOOK
    const addRecommendationsMutation = useMutation({
        mutationFn: async ({ work_id }: { work_id: string }) => {
            return axiosInstance.post<ApiResponse<never>>('api/recommendations/', {
                work_id
            });
        }
    });

    const addFinishedBookMutation = useMutation({
        mutationFn: async ({ work_id, bucket }: { work_id: string, bucket: Bucket }) => {
            if (rankingState.type !== 'rating') return;
            const { search_result } = rankingState;
            
            if (search_result.in_tbr) {
                return axiosInstance.patch<ApiResponse<never>>(`api/userbooks/${work_id}/`, {
                    status: BookStatus.READ,
                    bucket,
                });
            } else {
                return axiosInstance.post<ApiResponse<never>>('api/userbooks/', {
                    work_id,
                    status: BookStatus.READ,
                    bucket,
                });
            }
        },
        onSuccess: (_, { work_id, bucket }) => {
            if (rankingState.type !== 'rating') return;
            setRankingState({ type: 'comparing', book: rankingState.search_result.book });
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['searchBooks', query] });
            
            // Add recommendations if bucket is high
            if (bucket === 'high') {
                addRecommendationsMutation.mutate({ work_id });
                queryClient.invalidateQueries({ queryKey: ['recommendations'] });
            }
        },
    });

    const handleAddFinishedBook = (bucket: Bucket) => {
        if (rankingState.type !== 'rating') return;
        const { work_id } = rankingState.search_result.book;
        addFinishedBookMutation.mutate({ work_id, bucket });
    };



    // ADD TO BE READ
    const addTBRMutation = useMutation({
        mutationFn: async ({ work_id }: { work_id: string }) => {
            return axiosInstance.post<ApiResponse<never>>('api/userbooks/', {
                work_id,
                status: BookStatus.TO_BE_READ
            });
        },
        onSuccess: () => {
            setRankingState({ type: 'idle' });
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['searchBooks', query] });
        }
    });

    const handleAddTBR = () => {
        if (rankingState.type !== 'rating') return;
        const { work_id } = rankingState.search_result.book;
        addTBRMutation.mutate({ work_id });
    };



    // MISC
    const handleRowClick = (searchResult: SearchResult) => {
        setRankingState({ type: 'rating', search_result: searchResult });
    };

    const handleExit = () => {
        setRankingState({ type: 'idle' });
    };


    // Early return if loading
    if (isLoading) {
        return (
            <div className="container mx-auto flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="search-page container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2 gap-4">
            <h1 className="text-4xl font-bold mb-4 text-center">Search Results</h1>
            <div className="search-results space-y-4">
                {searchResults?.map((searchResult) => (
                    <BookRow
                        key={searchResult.book.work_id}
                        book={searchResult.book}
                        is_search_result={true}
                        onClick={() => handleRowClick(searchResult)}
                    />
                ))}
            </div>

            {rankingState.type === 'rating' && (
                <RateModal
                    onClickFunction={handleAddFinishedBook}
                    exitFunction={handleExit}
                    addTBRFunction={handleAddTBR}
                    book={rankingState.search_result.book}
                    status={(() => {
                        if (rankingState.search_result.in_library && rankingState.search_result.in_tbr) {
                            console.error("Book cannot be in both library and TBR");
                            return "SHOW_RATE_BUTTONS";
                        }
                        
                        if (rankingState.search_result.in_library) return "SHOW_IN_LIBRARY";
                        if (rankingState.search_result.in_tbr) return "SHOW_IN_TBR";
                        return "SHOW_RATE_BUTTONS";
                    })()}
                />
            )}
            
            {rankingState.type === 'comparing' && (
                <CompareModal
                    handleComparisonClick={handleComparisonClick}
                    selectedBook={rankingState.book}
                    comparedBook={getComparisonMutation.data}
                    exitFunction={handleExit}
                    isLoading={getComparisonMutation.isPending}
                />
            )}
        </div>
    );
}

export default Search; 