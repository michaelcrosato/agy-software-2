import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding AnswerFlow AI database...");

  // 1. Clean existing data
  await prisma.comment.deleteMany();
  await prisma.citation.deleteMany();
  await prisma.answerDraft.deleteMany();
  await prisma.question.deleteMany();
  await prisma.responseProject.deleteMany();
  await prisma.sourceChunk.deleteMany();
  await prisma.sourceDocument.deleteMany();
  await prisma.approvedAnswer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create seed users
  const user1 = await prisma.user.create({
    data: {
      id: "alex-johnson-id-seeded",
      email: "alex@example.com",
      name: "Alex Johnson",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: "sarah-miller-id-seeded",
      email: "sarah@example.com",
      name: "Sarah Miller",
      avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: "michael-crosato-id-seeded",
      email: "michael@example.com",
      name: "Michael Crosato",
      avatarUrl: "https://avatars.githubusercontent.com/u/58404198?v=4",
    },
  });

  console.log("Created users:", [user1.name, user2.name, user3.name]);

  // 3. Create Source Documents and Chunks
  const ssoDoc = await prisma.sourceDocument.create({
    data: {
      title: "Authentication and SSO Policy",
      fileType: "pdf",
      processingStatus: "Success",
      approvalStatus: "Approved",
      tags: "Security, Auth, SSO",
    },
  });

  const chunkSSO1 = await prisma.sourceChunk.create({
    data: {
      sourceDocumentId: ssoDoc.id,
      chunkIndex: 0,
      pageNumber: 1,
      sectionTitle: "SSO Providers",
      text: "We support Google Workspace SSO, Okta, and SAML 2.0. Users can configure Single Sign-On from the workspace settings dashboard.",
    },
  });

  const chunkSSO2 = await prisma.sourceChunk.create({
    data: {
      sourceDocumentId: ssoDoc.id,
      chunkIndex: 1,
      pageNumber: 2,
      sectionTitle: "Multi-Factor Authentication",
      text: "Multi-Factor Authentication (MFA) is mandatory for all employee accounts. We support TOTP, WebAuthn, and SMS verification.",
    },
  });

  const dbDoc = await prisma.sourceDocument.create({
    data: {
      title: "Disaster Recovery and Backup Policy",
      fileType: "docx",
      processingStatus: "Success",
      approvalStatus: "Approved",
      tags: "Infrastructure, Backups",
    },
  });

  const chunkDB1 = await prisma.sourceChunk.create({
    data: {
      sourceDocumentId: dbDoc.id,
      chunkIndex: 0,
      pageNumber: 1,
      sectionTitle: "Database Snapshots",
      text: "Our primary SQLite/Postgres databases are backed up continuously, with a full snapshot taken every 24 hours. The RPO is 4 hours and RTO is 12 hours.",
    },
  });

  const chunkDB2 = await prisma.sourceChunk.create({
    data: {
      sourceDocumentId: dbDoc.id,
      chunkIndex: 1,
      pageNumber: 1,
      sectionTitle: "Backup Encryption",
      text: "All database backups are encrypted at rest using AES-256 and stored across multiple geographic availability zones.",
    },
  });

  const residencyDoc = await prisma.sourceDocument.create({
    data: {
      title: "Data Residency and GDPR Compliance",
      fileType: "txt",
      processingStatus: "Success",
      approvalStatus: "Approved",
      tags: "Compliance, GDPR, AWS",
    },
  });

  const chunkResidency1 = await prisma.sourceChunk.create({
    data: {
      sourceDocumentId: residencyDoc.id,
      chunkIndex: 0,
      pageNumber: 1,
      sectionTitle: "Hosting Infrastructure",
      text: "We host all application servers and database instances in the AWS us-east-1 region (N. Virginia, USA). Custom EU-only hosting is available for enterprise tiers.",
    },
  });

  console.log("Created Source Documents and chunks.");

  // 4. Create Response Project
  const project = await prisma.responseProject.create({
    data: {
      name: "Enterprise Security Audit 2026",
      customerName: "Acme Corp",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
      status: "In Review",
    },
  });

  // 5. Create Questions
  const q1 = await prisma.question.create({
    data: {
      projectId: project.id,
      originalText: "Do you support Single Sign-On (SSO)? Please list the supported identity providers.",
      category: "Security",
      answerType: "Short Text",
      sourceLocation: "Row 12",
      status: "Needs Review",
      confidenceLabel: "High",
      assignedUserId: user2.id,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      projectId: project.id,
      originalText: "What is your database backup frequency and encryption standard?",
      category: "Infrastructure",
      answerType: "Long Text",
      sourceLocation: "Row 45",
      status: "Approved",
      confidenceLabel: "High",
      assignedUserId: user3.id,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      projectId: project.id,
      originalText: "Do you offer data hosting in the European Union (EU)?",
      category: "Compliance",
      answerType: "Short Text",
      sourceLocation: "Row 81",
      status: "Needs Review",
      confidenceLabel: "Medium",
      assignedUserId: user1.id,
    },
  });

  const q4 = await prisma.question.create({
    data: {
      projectId: project.id,
      originalText: "Is ISO 27001 certification currently held by your organization?",
      category: "Compliance",
      answerType: "Short Text",
      sourceLocation: "Row 99",
      status: "Needs Source",
      confidenceLabel: "Low",
      assignedUserId: user2.id,
    },
  });

  const q5 = await prisma.question.create({
    data: {
      projectId: project.id,
      originalText: "Do you support Single Sign-On (SSO) authentication?",
      category: "Security",
      answerType: "Short Text",
      sourceLocation: "Row 2",
      status: "Needs Review",
      confidenceLabel: "High",
      assignedUserId: user2.id,
    },
  });

  console.log("Created questions for active project.");

  // 6. Create Answer Drafts
  const draft1 = await prisma.answerDraft.create({
    data: {
      questionId: q1.id,
      text: "Yes, we support Google Workspace SSO, Okta, and SAML 2.0. Users can configure Single Sign-On from the workspace settings dashboard.",
    },
  });

  const draft2 = await prisma.answerDraft.create({
    data: {
      questionId: q2.id,
      text: "Primary databases are backed up continuously, with a full snapshot taken every 24 hours. Backups are encrypted at rest using AES-256 and stored across multiple zones.",
    },
  });

  const draft3 = await prisma.answerDraft.create({
    data: {
      questionId: q3.id,
      text: "We host all application servers and database instances in AWS us-east-1 (N. Virginia, USA). Custom EU-only hosting is available for enterprise tiers.",
    },
  });

  const draft4 = await prisma.answerDraft.create({
    data: {
      questionId: q4.id,
      text: "We do not currently hold an ISO 27001 certification, but we are fully SOC 2 compliant.",
    },
  });

  const draft5 = await prisma.answerDraft.create({
    data: {
      questionId: q5.id,
      text: "Yes, we support Google Workspace SSO, Okta, and SAML 2.0. Users can configure Single Sign-On from the workspace settings dashboard.",
    },
  });

  console.log("Created draft answers.");

  // 7. Create Citations
  await prisma.citation.create({
    data: {
      answerDraftId: draft1.id,
      sourceChunkId: chunkSSO1.id,
      quoteExcerpt: "We support Google Workspace SSO, Okta, and SAML 2.0. Users can configure Single Sign-On from the workspace settings dashboard.",
    },
  });

  await prisma.citation.create({
    data: {
      answerDraftId: draft2.id,
      sourceChunkId: chunkDB1.id,
      quoteExcerpt: "Our primary SQLite/Postgres databases are backed up continuously, with a full snapshot taken every 24 hours.",
    },
  });

  await prisma.citation.create({
    data: {
      answerDraftId: draft2.id,
      sourceChunkId: chunkDB2.id,
      quoteExcerpt: "All database backups are encrypted at rest using AES-256.",
    },
  });

  await prisma.citation.create({
    data: {
      answerDraftId: draft3.id,
      sourceChunkId: chunkResidency1.id,
      quoteExcerpt: "We host all application servers and database instances in the AWS us-east-1 region (N. Virginia, USA). Custom EU-only hosting is available for enterprise tiers.",
    },
  });

  console.log("Created source-cited citations.");

  // 8. Create comments
  await prisma.comment.createMany({
    data: [
      {
        questionId: q1.id,
        userId: user2.id,
        body: "Looks perfect! I'll approve this once we confirm SSO configuration docs are updated.",
      },
      {
        questionId: q3.id,
        userId: user3.id,
        body: "Make sure we mention the custom pricing add-on for custom hosting options in our response.",
      },
    ],
  });

  // 9. Populate Approved Answers Library
  await prisma.approvedAnswer.create({
    data: {
      canonicalQuestion: "Do you support Single Sign-On (SSO)?",
      answerText: "Yes, we support Google Workspace SSO, Okta, and SAML 2.0. Users can configure Single Sign-On from the workspace settings dashboard.",
      category: "Security",
      tags: "SSO, Authentication",
      usageCount: 15,
      lastUsedAt: new Date(),
      approvedById: user3.id,
    },
  });

  await prisma.approvedAnswer.create({
    data: {
      canonicalQuestion: "How often are database backups performed?",
      answerText: "Our primary databases are backed up continuously, with a full snapshot taken every 24 hours. Snaphots are encrypted using AES-256.",
      category: "Infrastructure",
      tags: "Backup, Encryption",
      usageCount: 8,
      lastUsedAt: new Date(),
      approvedById: user3.id,
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
