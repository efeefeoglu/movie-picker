export type MovieStatus = "new" | "watched" | "alone" | "secondary";

export type Movie = {
  id: string;
  imdb_url: string;
  source_url: string | null;
  title: string;
  categories: string[];
  poster_url: string | null;
  metascore: number | null;
  imdb_rating: number | null;
  duration: number | null;
  status: MovieStatus;
};
