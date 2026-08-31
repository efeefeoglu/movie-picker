export type MovieStatus = "new" | "watched" | "alone";

export type Movie = {
  id: string;
  imdb_url: string;
  title: string;
  categories: string[];
  poster_url: string;
  status: MovieStatus;
};
