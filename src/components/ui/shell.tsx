import type { ReactNode } from "react";

type ShellClassProps = {
  children: ReactNode;
  className?: string;
};

function withBaseClasses(
  baseClasses: string,
  maybeClassName?: string,
): string {
  if (!maybeClassName) {
    return baseClasses;
  }

  return `${baseClasses} ${maybeClassName}`;
}

export function PageHeader(props: {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}): React.JSX.Element {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-sky-950/20">
      {props.eyebrow ? (
        <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
          {props.eyebrow}
        </span>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {props.title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {props.description}
          </p>
        </div>
        {props.actions ? (
          <div className="flex flex-wrap gap-3">{props.actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function Card({
  children,
  className,
}: ShellClassProps): React.JSX.Element {
  return (
    <section
      className={withBaseClasses(
        "rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-sky-950/10",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function EmptyState(props: {
  action?: ReactNode;
  description: string;
  title: string;
}): React.JSX.Element {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center gap-4 border-dashed text-center">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">{props.title}</h3>
        <p className="max-w-xl text-sm leading-7 text-slate-300">
          {props.description}
        </p>
      </div>
      {props.action ? <div>{props.action}</div> : null}
    </Card>
  );
}

export function Shell(props: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}): React.JSX.Element {
  return (
    <div className="space-y-8">
      <PageHeader
        actions={props.actions}
        description={props.description}
        eyebrow={props.eyebrow}
        title={props.title}
      />
      {props.children}
    </div>
  );
}

export function AppShell(props: {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  title?: string;
}): React.JSX.Element {
  return (
    <div className="space-y-8">
      {props.title && props.description ? (
        <PageHeader
          actions={props.actions}
          description={props.description}
          eyebrow={props.eyebrow}
          title={props.title}
        />
      ) : null}
      {props.children}
    </div>
  );
}

export const AppShellHeader = PageHeader;
export const PageSectionHeader = PageHeader;
export const SectionHeader = PageHeader;
export const ShellSection = PageHeader;

export function PageSection(props: {
  children: ReactNode;
}): React.JSX.Element {
  return <div className="space-y-8">{props.children}</div>;
}

export function Page(props: {
  children: ReactNode;
}): React.JSX.Element {
  return <div className="space-y-8">{props.children}</div>;
}

export function Section({
  children,
  className,
}: ShellClassProps): React.JSX.Element {
  return <Card className={className}>{children}</Card>;
}

export function StatGrid(props: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}): React.JSX.Element {
  const columnsClassName =
    props.columns === 2
      ? "xl:grid-cols-2"
      : props.columns === 3
        ? "xl:grid-cols-3"
        : "xl:grid-cols-4";

  return (
    <section className={`grid gap-4 md:grid-cols-2 ${columnsClassName}`}>
      {props.children}
    </section>
  );
}
