import type { FinancialYear } from "../Dash/types";

// Bills
import {
  listBillYears,
  prefetchBillYears,
  prefetchAllBillsForYears,
  listBills,
  warmSupabasePdfs,
} from "../Dash/services/billsApi";

// Instruments
import {
  prefetchAllInstruments,
  prefetchCategories,
} from "../Equipments/services/instrumentsApi";

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export async function prefetchAfterLogin(): Promise<void> {
  try {
    // Kick off both domains in parallel
    await Promise.all([
      (async () => {
        // Instruments: full catalog
        await prefetchCategories();
        await prefetchAllInstruments(6);
      })(),
      (async () => {
        // Bills: all years and all pages
        await prefetchBillYears();
        const years: FinancialYear[] = await listBillYears().catch(() => [] as FinancialYear[]);
        const fyList = uniq(years);
        if (fyList.length > 0) {
          // Warm first page to get items for warming PDFs
          const firstFY = fyList[0];
          const firstPage = await listBills({ fy: firstFY, page: 1, limit: 10 }).catch(() => null);
          if (firstPage && firstPage.items) {
            // Warm a handful of PDFs to reduce time-to-first-byte
            await warmSupabasePdfs(firstPage.items, 16);
          }
          await prefetchAllBillsForYears(fyList, 10, 4);
        }
      })(),
    ]);
  } catch {
    // best-effort
  }
}
