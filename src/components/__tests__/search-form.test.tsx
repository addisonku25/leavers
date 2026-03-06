import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server action
vi.mock("@/actions/search", () => ({
  searchAction: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Must import after mocks
import { SearchForm } from "@/components/search-form";
import { searchAction } from "@/actions/search";

describe("SearchForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders company and role inputs", () => {
    render(<SearchForm />);

    expect(screen.getByLabelText("Company")).toBeDefined();
    expect(screen.getByLabelText("Role")).toBeDefined();
    expect(screen.getByRole("button", { name: /search/i })).toBeDefined();
  });

  it("shows inline validation errors when submitting empty form", async () => {
    render(<SearchForm />);

    const submitButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Company name is required")).toBeDefined();
      expect(screen.getByText("Role title is required")).toBeDefined();
    });

    // Server action should not be called with invalid data
    expect(searchAction).not.toHaveBeenCalled();
  });

  it("calls searchAction with valid input", async () => {
    const mockAction = vi.mocked(searchAction);
    mockAction.mockResolvedValue(undefined as never);

    render(<SearchForm />);

    const companyInput = screen.getByLabelText("Company");
    const roleInput = screen.getByLabelText("Role");

    fireEvent.change(companyInput, { target: { value: "Google" } });
    fireEvent.change(roleInput, { target: { value: "Software Engineer" } });

    const submitButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    // Verify FormData was passed with correct values
    const formData = mockAction.mock.calls[0][0] as FormData;
    expect(formData.get("company")).toBe("Google");
    expect(formData.get("role")).toBe("Software Engineer");
  });
});
