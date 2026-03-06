import { afterEach, describe, expect, it, vi } from "vitest";
import { getProvider } from "../data/provider-factory";
import { BrightDataProvider } from "../data/providers/brightdata";
import { MockProvider } from "../data/providers/mock";
import { ScrapInProvider } from "../data/providers/scrapin";

describe("getProvider", () => {
  const originalEnv = process.env.DATA_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATA_PROVIDER;
    } else {
      process.env.DATA_PROVIDER = originalEnv;
    }
  });

  it("returns MockProvider when DATA_PROVIDER is not set", () => {
    delete process.env.DATA_PROVIDER;
    const provider = getProvider();
    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.name).toBe("mock");
  });

  it("returns MockProvider when DATA_PROVIDER is 'mock'", () => {
    process.env.DATA_PROVIDER = "mock";
    const provider = getProvider();
    expect(provider).toBeInstanceOf(MockProvider);
  });

  it("returns BrightDataProvider when DATA_PROVIDER is 'brightdata'", () => {
    process.env.DATA_PROVIDER = "brightdata";
    const provider = getProvider();
    expect(provider).toBeInstanceOf(BrightDataProvider);
    expect(provider.name).toBe("brightdata");
  });

  it("returns ScrapInProvider when DATA_PROVIDER is 'scrapin'", () => {
    process.env.DATA_PROVIDER = "scrapin";
    const provider = getProvider();
    expect(provider).toBeInstanceOf(ScrapInProvider);
    expect(provider.name).toBe("scrapin");
  });

  it("falls back to MockProvider for unknown provider name", () => {
    process.env.DATA_PROVIDER = "unknown";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const provider = getProvider();
    expect(provider).toBeInstanceOf(MockProvider);
    warnSpy.mockRestore();
  });
});
