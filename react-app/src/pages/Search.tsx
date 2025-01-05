import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { CompareModal } from '../components/CompareModal';
import { ApiResponse, UserBook, Bucket, Book, BookStatus } from '../types/types';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);

    const [rankingState, setRankingState] = useState<RankingState>({ type: 'idle' });


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

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchInput) return;
        setSearchParams({ q: searchInput });
    };

    

    // ADD FINISHED BOOK
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
            // uncomment later when we have recommendations
            // if (bucket === 'high') {
            //     queryClient.invalidateQueries('recommendations');
            // }
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



    // GET COMPARISON
    const { data: comparisonData } = useQuery({
        queryKey: ['comparison', rankingState.type === 'comparing' ? rankingState.book.work_id : null],
        queryFn: async () => {
            const response = await axiosInstance.get<ApiResponse<UserBook>>('api/compare-book/', {
                params: { work_id: (rankingState as { type: 'comparing', book: Book }).book.work_id }
            });
            return response.data.data || null;
        },
        enabled: rankingState.type === 'comparing',
    });
    // not sure if I can avoid this, for now seems fine
    useEffect(() => {
        if (comparisonData === null && rankingState.type === 'comparing') {
            setRankingState({ type: 'idle' });
        }
    }, [comparisonData]);



    // COMPLETE COMPARISON
    const comparisonClickMutation = useMutation({
        mutationFn: async ({ newBookId, existingBookId, outcome }: { newBookId: string, existingBookId: string, outcome: number }) => {
            return axiosInstance.post<ApiResponse<never>>('api/compare-book/', {
                new_book_id: newBookId,
                existing_book_id: existingBookId,
                outcome,
            });
        },
        onSuccess: (_, { outcome }) => {
            if (rankingState.type === 'comparing') {
                queryClient.invalidateQueries({ queryKey: ['comparison', rankingState.book.work_id] });
            }
            if (outcome !== -1) {
                // only invalidate if the books were NOT marked as "not comparable"
                queryClient.invalidateQueries({ queryKey: ['books'] });
                queryClient.invalidateQueries({ queryKey: ['userData'] });
            }
        }
    });

    const handleComparisonClick = (o: number) => {
        if (rankingState.type !== 'comparing' || !comparisonData) return;
        
        comparisonClickMutation.mutate({
            newBookId: rankingState.book.work_id,
            existingBookId: comparisonData.work_id,
            outcome: o,
        });
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
            <h1 className="text-4xl font-bold mb-4 text-center">Search</h1>
            <div className="w-full flex flex-col items-center justify-center">
                <form onSubmit={handleSearch} className="flex w-2/3">
                    <input
                        type="text"
                        placeholder="Search for a book title or author"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="flex-grow p-2 pl-10 text-sm text-black rounded-l bg-gray-200 outline-none"
                    />
                    <button
                        type="submit"
                        className="p-2 text-sm bg-gray-200 rounded-r flex items-center justify-center"
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </form>
            </div>
            <div className="search-results">
                {searchResults.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-4 py-2 text-center text-lg rounded-l">Cover</th>
                                <th className="px-4 py-2 text-center text-lg">Title</th>
                                <th className="px-4 py-2 text-center text-lg">Author</th>
                                <th className="px-4 py-2 text-center text-lg">Avg Rating</th>
                                <th className="px-4 py-2 text-center text-lg rounded-r"># Ratings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchResults.map((searchResult) => (
                                <tr 
                                    key={searchResult.book.work_id} 
                                    onClick={() => handleRowClick(searchResult)} 
                                    className="hover:bg-gray-100"
                                >
                                    <td className="px-4 py-2 text-center rounded-l">
                                        <img src={searchResult.book.image_url} alt={searchResult.book.title} className="inline-block rounded" />
                                    </td>
                                    <td className="text-center">{searchResult.book.title}</td>
                                    <td className="text-center">{searchResult.book.author}</td>
                                    <td className="text-center">
                                        {searchResult.book.average_rating ? searchResult.book.average_rating.toFixed(2) : '—'}
                                    </td>
                                    <td className="text-center rounded-r">
                                        {searchResult.book.ratings_count.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

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
                
                {rankingState.type === 'comparing' && comparisonData && (
                    <CompareModal
                        handleComparisonClick={handleComparisonClick}
                        selectedBook={rankingState.book}
                        comparedBook={comparisonData}
                        exitFunction={handleExit}
                    />
                )}
            </div>
        </div>
    );
}

export default Search; 