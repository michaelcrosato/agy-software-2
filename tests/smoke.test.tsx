import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DashboardPage from "../src/app/page";
import { Navbar } from "../src/components/Navbar";

describe("Dashboard page", () => {
  it("renders AnswerFlow AI branding in the page heading", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AnswerFlow AI"
    );
  });

  it("renders the empty-state message in plain English", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText(/your dashboard is being set up/i)
    ).toBeInTheDocument();
  });
});

describe("Navbar", () => {
  it("renders AnswerFlow AI brand link", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /AnswerFlow AI home/i })).toBeInTheDocument();
  });

  it("renders navigation links for Dashboard, Projects, and Sources", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /projects/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sources/i })).toBeInTheDocument();
  });
});
