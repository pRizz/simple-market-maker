type StatCardProps = {
  accent?: string;
  description?: string;
  detail?: string;
  helper?: string;
  label: string;
  title?: string;
  value: string;
};

export function StatCard({
  accent,
  description,
  label,
  helper,
  title,
  value,
  detail,
}: StatCardProps): React.JSX.Element {
  const heading = title ?? label;
  const supportingText = detail ?? description ?? helper;

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-slate-950/30">
      <p className="text-sm text-slate-400">{heading}</p>
      <p
        className={[
          "mt-2 text-2xl font-semibold text-white",
          accent ?? "",
        ].join(" ").trim()}
      >
        {value}
      </p>
      {supportingText ? (
        <p className="mt-2 text-sm text-slate-400">{supportingText}</p>
      ) : null}
    </article>
  );
}
