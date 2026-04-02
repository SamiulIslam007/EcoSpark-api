export type VoteType = "UPVOTE" | "DOWNVOTE";

export interface ICastVoteBody {
  type: VoteType;
}
