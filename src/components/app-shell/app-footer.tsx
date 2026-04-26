import { ProvenanceFooter } from "@/components/app-shell/provenance-footer";
import { getBuildInfo } from "@/modules/build-info/build-info";

export function AppFooter(): React.JSX.Element {
  const buildInfo = getBuildInfo();

  return <ProvenanceFooter buildInfo={buildInfo} />;
}
