export interface ICreateIdeaPayload {
  title: string;
  problemStatement: string;
  proposedSolution: string;
  description: string;
  categoryId: string;
  isPaid?: boolean;
  price?: number;
  images?: string[];
  status?: "DRAFT" | "UNDER_REVIEW";
}

export interface IUpdateIdeaPayload {
  title?: string;
  problemStatement?: string;
  proposedSolution?: string;
  description?: string;
  categoryId?: string;
  isPaid?: boolean;
  price?: number;
  images?: string[];
}

export interface IGetIdeasQuery {
  page?: string;
  limit?: string;
  category?: string;
  sort?: string;
  search?: string;
  isPaid?: string;
  authorId?: string;
  /** Partial match on author display name (from /ideas filters) */
  author?: string;
  minVotes?: string;
}
