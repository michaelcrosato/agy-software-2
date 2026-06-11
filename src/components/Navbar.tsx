import { LayoutDashboard, FolderOpen, Database } from "lucide-react";
import { APP_NAME } from "../lib/constants";

const navLinks = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderOpen },
  { label: "Sources", href: "/sources", icon: Database },
];

export function Navbar() {
  return (
    <nav
      aria-label="Main navigation"
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          height: "56px",
        }}
      >
        <a
          href="/"
          aria-label={`${APP_NAME} home`}
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "var(--color-accent)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {APP_NAME}
        </a>

        <ul
          style={{
            display: "flex",
            gap: "0.25rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {navLinks.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <a
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.375rem",
                  color: "var(--color-text-secondary)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
