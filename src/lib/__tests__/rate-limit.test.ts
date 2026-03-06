import { describe, it, expect } from "vitest";

describe("rate-limit", () => {
  it.todo("creates guest search limiter with 3/day window"); // PRIV-02
  it.todo("creates auth search limiter with 50/hour window"); // PRIV-02
  it.todo("creates auth endpoint limiter with 5/15min window"); // PRIV-02
  it.todo("exports null limiters when redis is unavailable"); // PRIV-02
});
