import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsPage from "@/app/terms/page";
import PrivacyPage from "@/app/privacy/page";

describe("legal-pages", () => {
  it("terms page renders without error", () => {
    const { container } = render(<TermsPage />);
    expect(container).toBeDefined();
    expect(screen.getByText("Terms of Service")).toBeDefined();
    expect(screen.getByText(/Acceptance of Terms/i)).toBeDefined();
  });

  it("privacy page renders without error", () => {
    const { container } = render(<PrivacyPage />);
    expect(container).toBeDefined();
    expect(screen.getByText("Privacy Policy")).toBeDefined();
    expect(screen.getByText(/Data Sources/i)).toBeDefined();
  });

  it("privacy page covers individual career data with auth-gating", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Individual Career Data")).toBeDefined();
    expect(screen.getByText(/authenticated users/i)).toBeDefined();
  });
});
