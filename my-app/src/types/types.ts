// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

export interface LoginResponseData {
    token: string;
}

// export interface SearchResponseData {
//     work_id: string;
//     title: string;
//     author: string;
//     image_url: string;
//     description: string;
// }

// export interface SearchBookList extends Array<SearchResponseData> {}

// Book types
export type Rating = "high" | "medium" | "low";

export interface Book {
    id: number;
    work_id: string;
    title: string;
    author: string;
    image_url: string;
    description?: string;
}

export interface TBRBook extends Book {
    date_added: string;
    is_ranked: boolean;
}

export interface UserBook extends TBRBook {
    rating: Rating | null;
    normalized_rating: number | null;
}