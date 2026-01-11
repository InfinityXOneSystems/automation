import { LedgerManager, LedgerEntry } from "../run-ledger";

export function addCommand(manager: LedgerManager, args: string[]): void {
  const module = args.find(a => a.startsWith("--module="))?.split("=")[1] || "unknown";
  const action = args.find(a => a.startsWith("--action="))?.split("=")[1] || "unknown";
  const status = args.find(a => a.startsWith("--status="))?.split("=")[1] as LedgerEntry["status"] || "success";
  const duration = parseInt(args.find(a => a.startsWith("--duration="))?.split("=")[1] || "0");

  manager.addEntry({
    module,
    action,
    status,
    duration: duration || undefined
  });
}
