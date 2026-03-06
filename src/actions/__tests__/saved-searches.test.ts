import { describe, it, expect } from "vitest";

describe("saved-searches", () => {
  it.todo("save - saves search for authenticated user"); // SAVE-01
  it.todo("save - is idempotent for same user+search"); // SAVE-01
  it.todo("save - rejects unauthenticated requests"); // SAVE-01
  it.todo("list - returns saved searches for authenticated user"); // SAVE-02
  it.todo("list - orders by createdAt descending"); // SAVE-02
  it.todo("delete - removes saved search owned by user"); // SAVE-03
  it.todo("delete - rejects deletion of another user's search"); // SAVE-03
});
