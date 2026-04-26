"use client";

export type DataTableColumn<Row> = {
  align?: "left" | "right";
  key: string;
  label: string;
  render: (row: Row) => React.ReactNode;
};

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  emptyMessage: string;
  rows: Row[];
};

export function DataTable<Row>({
  columns,
  emptyMessage,
  rows,
}: DataTableProps<Row>): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm text-slate-300">
          <thead className="bg-slate-950/50 text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
