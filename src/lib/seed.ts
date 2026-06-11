/**
 * seed — deterministic, idempotent fixture data for AnswerFlow AI (F-0002)
 * Exported as an async function so the integration test can call it directly.
 * prisma/seed.ts is the thin CLI entry that imports this.
 *
 * Semantics: DELETE all rows in FK-safe order, then INSERT with stable hardcoded IDs.
 * Running twice produces identical counts — no duplicates, no constraint crashes.
 */

import type { PrismaClient } from "../../prisma/generated/client";

// ---------------------------------------------------------------------------
// Stable fixture IDs
// ---------------------------------------------------------------------------

const USERS = [
  { id: "user-alice-001", name: "Alice Nguyen", email: "alice@example.com" },
  { id: "user-bob-002", name: "Bob Reyes", email: "bob@example.com" },
  {
    id: "user-carol-003",
    name: "Carol Hoffmann",
    email: "carol@example.com",
  },
];

const PROJECT = {
  id: "proj-questionnaire-1",
  name: "Acme Corp Security Questionnaire",
};

// Sources
const SRC_SSO = { id: "src-sso", name: "SSO & Authentication Policy", type: "seed" };
const SRC_BDR = {
  id: "src-bdr",
  name: "Backup & Disaster Recovery Policy",
  type: "seed",
};
const SRC_GDP = { id: "src-gdpr", name: "GDPR & Data Privacy Policy", type: "seed" };

// Questions — 10 total, 2 near-duplicate pairs, 2 drafted, 8 unanswered
const QUESTIONS = [
  {
    id: "q-01",
    order: 1,
    category: "Security",
    section: "Identity",
    status: "drafted",
    text: "Do you support single sign-on (SSO)?",
  },
  {
    id: "q-02",
    order: 2,
    category: "Security",
    section: "Identity",
    status: "unanswered",
    // near-duplicate of q-01
    text: "Does your platform integrate with SAML/SSO identity providers?",
  },
  {
    id: "q-03",
    order: 3,
    category: "Compliance",
    section: "Certifications",
    status: "unanswered",
    text: "Do you hold a SOC 2 Type II certification?",
  },
  {
    id: "q-04",
    order: 4,
    category: "Compliance",
    section: "Certifications",
    status: "unanswered",
    text: "Are you ISO 27001 certified?",
  },
  {
    id: "q-05",
    order: 5,
    category: "Security",
    section: "Backup",
    status: "drafted",
    text: "How frequently do you perform database backups?",
  },
  {
    id: "q-06",
    order: 6,
    category: "Security",
    section: "Backup",
    status: "unanswered",
    // near-duplicate of q-05
    text: "What is your backup frequency and retention policy for customer data?",
  },
  {
    id: "q-07",
    order: 7,
    category: "Privacy",
    section: null,
    status: "unanswered",
    text: "Do you have a Data Processing Agreement (DPA) available?",
  },
  {
    id: "q-08",
    order: 8,
    category: "Privacy",
    section: "GDPR",
    status: "unanswered",
    text: "How do you handle data subject access requests (DSAR) under GDPR?",
  },
  {
    id: "q-09",
    order: 9,
    category: null,
    section: null,
    status: "unanswered",
    text: "Where is customer data stored geographically?",
  },
  {
    id: "q-10",
    order: 10,
    category: "Security",
    section: "Encryption",
    status: "unanswered",
    text: "Is data encrypted at rest and in transit?",
  },
];

// Answers for the two drafted questions
const ANSWERS = [
  {
    id: "ans-q01",
    questionId: "q-01",
    text: "Yes. Our platform supports SAML 2.0 and OIDC-based single sign-on. We are certified with Okta, Azure AD, and Google Workspace. Multi-factor authentication (MFA) is enforced for all SSO sessions. Customers can manage user provisioning via SCIM.",
  },
  {
    id: "ans-q05",
    questionId: "q-05",
    text: "We perform incremental backups every 6 hours and full backups daily. All backup data is encrypted at rest using AES-256. The current RTO is 4 hours and RPO is 6 hours. Backups are retained for 30 days and stored in a geographically separate data centre.",
  },
];

// Chunks — 5 per source = 15 total
const CHUNKS_SSO = [
  {
    id: "chunk-sso-01",
    sourceId: "src-sso",
    position: 1,
    text: "All user access to the platform is governed by our SSO & Authentication Policy. We support SAML 2.0 and OIDC protocols, enabling customers to integrate with any compliant identity provider including Okta, Azure AD, and Google Workspace.",
  },
  {
    id: "chunk-sso-02",
    sourceId: "src-sso",
    position: 2,
    text: "Multi-factor authentication (MFA) is mandatory for all privileged accounts and strongly recommended for all end users. Time-based one-time passwords (TOTP) and hardware FIDO2 keys are supported as second factors.",
  },
  {
    id: "chunk-sso-03",
    sourceId: "src-sso",
    position: 3,
    text: "OAuth 2.0 authorization code flow with PKCE is used for all API integrations. Client credentials are rotated every 90 days and stored in a secrets manager — never in environment variables or source code.",
  },
  {
    id: "chunk-sso-04",
    sourceId: "src-sso",
    position: 4,
    text: "Session tokens are issued as short-lived JWTs (15-minute expiry) backed by rotating refresh tokens. Revocation propagates within 60 seconds across all nodes via our event-driven token blacklist.",
  },
  {
    id: "chunk-sso-05",
    sourceId: "src-sso",
    position: 5,
    text: "User provisioning and de-provisioning follow the SCIM 2.0 standard. When an identity provider deactivates a user, the account is suspended in our system within 5 minutes, preventing access without requiring manual intervention.",
  },
];

const CHUNKS_BDR = [
  {
    id: "chunk-bdr-01",
    sourceId: "src-bdr",
    position: 1,
    text: "Our Backup & Disaster Recovery Policy defines an RPO (Recovery Point Objective) of 6 hours and an RTO (Recovery Time Objective) of 4 hours for tier-1 services. These targets are tested quarterly via simulated failover drills.",
  },
  {
    id: "chunk-bdr-02",
    sourceId: "src-bdr",
    position: 2,
    text: "Incremental database snapshots are taken every 6 hours and uploaded to an isolated cloud storage bucket with encryption-at-rest using AES-256-GCM. Full backups run nightly and cross-replicate to a secondary geographic region.",
  },
  {
    id: "chunk-bdr-03",
    sourceId: "src-bdr",
    position: 3,
    text: "All backup archives are immutable for 30 days using object-lock policies, preventing accidental or malicious deletion. Access to backup buckets is restricted to the automated backup service account via IAM role binding.",
  },
  {
    id: "chunk-bdr-04",
    sourceId: "src-bdr",
    position: 4,
    text: "Restoration procedures are documented and version-controlled. Engineers practice restore-from-backup annually in a staging environment that mirrors production. Restoration success is logged, reviewed, and reported to the security steering committee.",
  },
  {
    id: "chunk-bdr-05",
    sourceId: "src-bdr",
    position: 5,
    text: "In the event of a regional outage, traffic is automatically routed to the disaster-recovery region within 10 minutes via DNS failover. Customer data remains consistent through synchronous replication of transaction logs.",
  },
];

const CHUNKS_GDPR = [
  {
    id: "chunk-gdpr-01",
    sourceId: "src-gdpr",
    position: 1,
    text: "Our GDPR & Data Privacy Policy governs all processing of personal data belonging to EU/EEA data subjects. We act as a data processor on behalf of customers (data controllers) and execute a Data Processing Agreement (DPA) upon request.",
  },
  {
    id: "chunk-gdpr-02",
    sourceId: "src-gdpr",
    position: 2,
    text: "Cross-border data transfers to third countries are covered by Standard Contractual Clauses (SCCs) approved by the European Commission. We maintain a sub-processor list and notify customers of any changes with 30 days' notice.",
  },
  {
    id: "chunk-gdpr-03",
    sourceId: "src-gdpr",
    position: 3,
    text: "Data subject rights — including right to access, right to erasure, and right to portability — are fulfilled within 30 days. Our privacy portal allows end users to submit requests directly; responses are tracked and audited.",
  },
  {
    id: "chunk-gdpr-04",
    sourceId: "src-gdpr",
    position: 4,
    text: "Customer data residency is configurable: EU-region customers can elect to store all personal data exclusively in Frankfurt (eu-central-1), ensuring no cross-border transfers occur by default.",
  },
  {
    id: "chunk-gdpr-05",
    sourceId: "src-gdpr",
    position: 5,
    text: "We maintain a Record of Processing Activities (RoPA) as required by GDPR Article 30. Annual privacy impact assessments (DPIAs) are conducted for high-risk processing activities and results shared with our Data Protection Officer.",
  },
];

const ALL_CHUNKS = [...CHUNKS_SSO, ...CHUNKS_BDR, ...CHUNKS_GDPR];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function seed(prisma: PrismaClient): Promise<void> {
  // Delete in FK-safe order (dependents first)
  await prisma.answer.deleteMany();
  await prisma.chunk.deleteMany();
  await prisma.question.deleteMany();
  await prisma.project.deleteMany();
  await prisma.source.deleteMany();
  await prisma.user.deleteMany();

  // Users
  for (const user of USERS) {
    await prisma.user.create({ data: user });
  }

  // Sources
  for (const src of [SRC_SSO, SRC_BDR, SRC_GDP]) {
    await prisma.source.create({ data: src });
  }

  // Chunks
  for (const chunk of ALL_CHUNKS) {
    await prisma.chunk.create({ data: chunk });
  }

  // Project
  await prisma.project.create({ data: PROJECT });

  // Questions
  for (const q of QUESTIONS) {
    await prisma.question.create({
      data: {
        id: q.id,
        projectId: PROJECT.id,
        text: q.text,
        category: q.category,
        section: q.section,
        order: q.order,
        status: q.status,
      },
    });
  }

  // Answers for drafted questions
  for (const ans of ANSWERS) {
    await prisma.answer.create({ data: ans });
  }

  console.log(
    `[seed] Done — 3 users, 1 project, 10 questions, 2 answers, 3 sources, ${ALL_CHUNKS.length} chunks`,
  );
}
