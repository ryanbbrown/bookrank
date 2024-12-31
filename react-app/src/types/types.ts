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
export type Bucket = "high" | "medium" | "low";

export enum BookStatus {
  READ = "read",
  CURRENTLY_READING = "currently_reading",
  TO_BE_READ = "to_be_read"
}

export interface Book {
    work_id: string;
    title: string;
    author: string;
    description?: string;
    image_url: string;
    book_type: string;
    genre: string;
    ratings_count: number;
    average_rating: number | null;
}

export interface UserBook extends Book {
    date_added: string;
    status: BookStatus;
    date_finished: string | null;
    bucket: Bucket | null;
    normalized_rating: number | null;
    elo_rating: number | null;
    RD: number | null;
    is_ranked: boolean | null;
}

export interface UserAccount {
    id: number;
    username: string;
    nonfiction_ranked_books_count: number;
    fiction_ranked_books_count: number;
    childrens_ranked_books_count: number;
    total_ranked_books_count: number;
}