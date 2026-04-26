import "server-only";

import packageJson from "../../../package.json";

export type BuildInfo = {
  version: string;
  commit: string;
  shortCommit: string;
  buildTime: string;
  copyableSummary: string;
};

function valueOrUnavailable(maybeValue: string | undefined): string {
  if (!maybeValue) {
    return "Unavailable";
  }

  const trimmedValue = maybeValue.trim();
  if (!trimmedValue) {
    return "Unavailable";
  }

  return trimmedValue;
}

export function getBuildInfo(): BuildInfo {
  const version = valueOrUnavailable(
    process.env.NEXT_PUBLIC_APP_VERSION ?? packageJson.version,
  );
  const commit = valueOrUnavailable(process.env.NEXT_PUBLIC_APP_COMMIT);
  const buildTime = valueOrUnavailable(process.env.NEXT_PUBLIC_APP_BUILD_TIME);
  const shortCommit =
    commit === "Unavailable" ? "Unavailable" : commit.slice(0, 7);

  return {
    version,
    commit,
    shortCommit,
    buildTime,
    copyableSummary: `version=${version} commit=${commit} build=${buildTime}`,
  };
}
