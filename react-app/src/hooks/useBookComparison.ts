import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, UserBook } from '../types/types';
import axiosInstance from '../axiosConfig';

interface UseBookComparisonProps {
    setJustRankedBookId?: (id: string) => void;
    onNoMoreComparisons?: () => void;
    getNextUnranked?: boolean;
}

export function useBookComparison({ 
    setJustRankedBookId, 
    onNoMoreComparisons, 
    getNextUnranked = false
}: UseBookComparisonProps = {}) {
    const queryClient = useQueryClient();

    const getComparisonMutation = useMutation({
        mutationFn: async (workId: string) => {
            const response = await axiosInstance.post<ApiResponse<UserBook>>('api/compare-book/', {
                work_id: workId
            });
            return response.data.data || null;
        },
        onSuccess: (data, workId) => {
            if (data === null) {
                setJustRankedBookId?.(workId);
                if (!getNextUnranked) {
                    onNoMoreComparisons?.();
                }
                queryClient.invalidateQueries({ queryKey: ['books'] });
                queryClient.invalidateQueries({ queryKey: ['userData'] });
            }
        }
    });

    const comparisonClickMutation = useMutation({
        mutationFn: ({ newBookId, existingBookId, outcome }: { newBookId: string, existingBookId: string, outcome: number }) =>
            axiosInstance.patch<ApiResponse<never>>('api/compare-book/', {
                new_book_id: newBookId,
                existing_book_id: existingBookId,
                outcome: outcome,
            }),
        onSuccess: (_, { newBookId, outcome }) => {
            if (outcome !== -1) {
                // only invalidate if the books were NOT marked as "not comparable"
                queryClient.invalidateQueries({ queryKey: ['books'] });
                queryClient.invalidateQueries({ queryKey: ['userData'] });
            }
            // Get the next comparison after completing the current one
            getComparisonMutation.mutate(newBookId);
        }
    });

    const handleComparisonClick = (newBookId: string, existingBookId: string, outcome: number) => {
        comparisonClickMutation.mutate({
            newBookId,
            existingBookId,
            outcome,
        });
    };

    return {
        getComparisonMutation,
        comparisonClickMutation,
        handleComparisonClick
    };
}

// Add this empty export to ensure the file is treated as a module
export {}; 