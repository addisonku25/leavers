import type { DataProvider } from "./types";
import { MockProvider } from "./providers/mock";
import { ScrapInProvider } from "./providers/scrapin";

export type ProviderName = "scrapin" | "mock";

/**
 * Resolve the data provider from environment configuration.
 * Reads DATA_PROVIDER env var. Defaults to "mock" if not set.
 */
export function getProvider(): DataProvider {
  const providerName = (process.env.DATA_PROVIDER ?? "mock") as ProviderName;

  switch (providerName) {
    case "scrapin":
      return new ScrapInProvider();
    case "mock":
      return new MockProvider();
    default:
      console.warn(`Unknown DATA_PROVIDER "${providerName}", falling back to mock`);
      return new MockProvider();
  }
}
