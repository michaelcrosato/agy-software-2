import { APP_NAME, APP_TAGLINE } from "../lib/constants";

export default function DashboardPage() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 0.5rem 0",
          }}
        >
          {APP_NAME}
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          {APP_TAGLINE}
        </p>
      </header>

      <section
        aria-labelledby="dashboard-heading"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <h2
          id="dashboard-heading"
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: "0 0 0.75rem 0",
          }}
        >
          Your dashboard is being set up
        </h2>
        <p
          style={{
            color: "var(--color-text-secondary)",
            margin: 0,
            maxWidth: "480px",
            marginInline: "auto",
          }}
        >
          Projects and RFP responses will appear here once your workspace is
          ready. Check back soon.
        </p>
      </section>
    </div>
  );
}
