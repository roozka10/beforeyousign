export type Deal = {
  id: string;
  title: string;
  score: number;
  summary: string;
  date: string;
};

export const fakeDeals: Deal[] = [
  {
    id: "1",
    title: "Client Contract",
    score: 62,
    summary: "Kinda iffy. You might be stuck longer than you'd like.",
    date: "2 days ago",
  },
  {
    id: "2",
    title: "Job Offer",
    score: 41,
    summary: "Yeah… this one's a bit sketchy. A few red flags in here.",
    date: "5 days ago",
  },
  {
    id: "3",
    title: "NDA",
    score: 85,
    summary: "Looks good. Nothing weird jumping out.",
    date: "1 week ago",
  },
];

export function getScoreColor(score: number) {
  if (score >= 70) return "success";
  if (score >= 55) return "warning";
  return "danger";
}

export function getScoreEmoji(score: number) {
  if (score >= 70) return "🟢";
  if (score >= 55) return "🟡";
  return "🔴";
}
