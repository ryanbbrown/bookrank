export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

// You can also define specific response data types here
export interface LoginResponseData {
    token: string;
}
  
export interface SearchResponseData {
    work_id: string;
    title: string;
    author: string;
    image_url: string;
    description: string;
}