import Badge from "../../../shared/ui/Badge";
import type { ProxyEntry } from "../model/types";

export function ProxyTypeBadge({ kind }: { kind: ProxyEntry["kind"] }) {
  return (
    <Badge
      size="small"
      variant="light"
      color={
        kind === "socks5"
          ? "primary"
          : kind === "https"
            ? "success"
            : kind === "http"
              ? "warning"
              : "gray"
      }
    >
      {kind.toUpperCase()}
    </Badge>
  );
}
