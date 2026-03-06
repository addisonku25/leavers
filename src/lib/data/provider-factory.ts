import type { DataProvider } from "./types";
import { MockProvider } from "./providers/mock";
import { ScrapInProvider } from "./providers/scrapin";
import { BrightDataProvider } from "./providers/brightdata";

export type ProviderName = "brightdata" | "scrapin" | "mock";

/**
 * Resolve the data provider from environment configuration.
 * Reads DATA_PROVIDER env var. Defaults to "mock" if not set.
 *
 * Supported providers:
 * - "mock" (default): Deterministic fake data for development
 * - "brightdata": BrightData LinkedIn People Profile dataset (~$0.001/record)
 * - "scrapin": ScrapIn LinkedIn enrichment API (~$0.01/record)
 */
export function getProvider(): DataProvider {
  const providerName = (process.env.DATA_PROVIDER ?? "mock") as ProviderName;

  switch (providerName) {
    case "brightdata":
      return new BrightDataProvider();
    case "scrapin":
      return new ScrapInProvider();
    case "mock":
      return new MockProvider();
    default:
      console.warn(`Unknown DATA_PROVIDER "${providerName}", falling back to mock`);
      return new MockProvider();
  }
}
