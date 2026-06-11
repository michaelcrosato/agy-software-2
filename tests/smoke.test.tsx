import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Navbar } from "../src/components/Navbar";

// Mock the shared Prisma client so the unit test never touches the real database.
// This keeps the test hermetic (no DB setup needed) and lets us control the
// project list returned by the async server component.
vi.mock("../src/lib/prisma", () => ({
  default: {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $disconnect: vi.fn(),
  },
}));

// Import after mock registration so the module uses the stub.
const { default: DashboardPage } = await import("../src/app/page");

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders AnswerFlow AI branding in the page heading", async () => {
    // DashboardPage is now an async server component; await the resolved JSX
    // before handing it to render(). All assertions are preserved unchanged.
    const jsx = await DashboardPage();
    render(jsx);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AnswerFlow AI"
    );
  });

  it("renders the empty-state message in plain English", async () => {
    // Prisma mock returns [] so the page shows the empty state.
    const jsx = await DashboardPage();
    render(jsx);
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
