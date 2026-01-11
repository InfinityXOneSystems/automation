import { LedgerManager } from "../run-ledger";

export function statsCommand(manager: LedgerManager): void {
  const stats = manager.getStatistics();
  console.log(JSON.stringify(stats, null, 2));
}
