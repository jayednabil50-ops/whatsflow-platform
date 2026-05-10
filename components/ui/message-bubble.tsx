export function MessageBubble({
  from,
  body,
  time
}: {
  from: "me" | "them";
  body: string;
  time: string;
}) {
  return (
    <div className={`flex ${from === "me" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs rounded-md px-3 py-2 text-sm shadow-sm ${
          from === "me" ? "bg-accent text-accent-foreground" : "border border-border bg-card text-foreground"
        }`}
      >
        <p>{body}</p>
        <p className="mt-1 text-right text-[10px] opacity-75">{time}</p>
      </div>
    </div>
  );
}
