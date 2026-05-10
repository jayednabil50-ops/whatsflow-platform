type Row = Record<string, string | number>;

export function DataTable({ rows }: { rows: Row[] }) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  return (
    <div className="overflow-auto rounded-md border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-card-strong">
          <tr>
            {keys.map((key) => (
              <th key={key} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {key.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-border/80 transition hover:bg-muted/40">
              {keys.map((key) => (
                <td key={key} className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
