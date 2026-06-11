import { APP_NAME, APP_TAGLINE } from "../lib/constants";
import prisma from "../lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch projects; yield empty list if the DB is missing or the table doesn't exist yet.
  let projects: { id: string; name: string; createdAt: Date; _count: { questions: number } }[] = [];
  try {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    });
  } catch {
    // Database not yet initialised — render the empty state rather than crash.
    projects = [];
  }

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

      {projects.length === 0 ? (
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
      ) : (
        <section aria-labelledby="projects-heading">
          <h2
            id="projects-heading"
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: "0 0 1rem 0",
            }}
          >
            Projects
          </h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {projects.map((project) => (
              <li
                key={project.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    margin: "0 0 0.25rem 0",
                  }}
                >
                  {project.name}
                </p>
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "0.875rem",
                    margin: 0,
                  }}
                >
                  {project._count.questions} question{project._count.questions !== 1 ? "s" : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
