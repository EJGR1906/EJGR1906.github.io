# Bolt's Journal - Critical Learnings

## 2025-05-18 - Repetitive exchange rate DB lookups in batch processing
**Learning:** `convertCurrency` / `getConversionRate` was hitting `getLatestExchangeRate` (and Dexie/Supabase DB queries) repeatedly for every transaction when processing dashboard summaries and charts. Memoizing exchange rates in memory or caching rate conversions during batch loops dramatically reduces DB calls and execution time from O(N * DB_latency) to O(1) rate fetches.
**Action:** Always reuse cached exchange rates when iterating over transaction lists or calculating balances across multiple items.
