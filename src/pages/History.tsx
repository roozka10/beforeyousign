import { useNavigate } from "react-router-dom";
import { fakeDeals, getScoreColor } from "@/lib/dealscore-data";
import { cn } from "@/lib/utils";

const History = () => {
  const navigate = useNavigate();
  return (
    <div className="px-10 py-16 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-5xl font-semibold tracking-tight mb-3">History</h1>
      <p className="text-muted-foreground text-lg mb-12">
        Everything you've checked so far.
      </p>

      <div className="bg-card rounded-3xl border border-border shadow-card divide-y divide-border overflow-hidden">
        {fakeDeals.map((d) => {
          const color = getScoreColor(d.score);
          return (
            <button
              key={d.id}
              onClick={() => navigate(`/result/${d.id}`)}
              className="w-full flex items-center justify-between p-6 hover:bg-accent/40 transition-smooth text-left"
            >
              <div>
                <p className="font-medium text-base">{d.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{d.date}</p>
              </div>
              <div
                className={cn(
                  "text-3xl font-semibold tabular-nums tracking-tight",
                  color === "success" && "text-success",
                  color === "warning" && "text-warning",
                  color === "danger" && "text-danger"
                )}
              >
                {d.score}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default History;
