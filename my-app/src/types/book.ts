export type Rating = "high" | "medium" | "low";

export interface Book {
  id: number;
  work_id: string;
  title: string;
  author: string;
  image_url: string;
  normalized_rating: number | null;
  rating: Rating | null;
  date_added: string; // should this be nullable?
  is_ranked: boolean;
  description?: string; // why is there a question mark here?
} 