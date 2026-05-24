import { prisma } from "../lib/prisma";

async function main() {
  const project = await prisma.responseProject.findFirst({
    where: { name: "Enterprise Security Audit 2026" },
    include: { questions: true }
  });

  if (!project) {
    console.log("Project not found");
    return;
  }

  console.log("Project:", project.name, "ID:", project.id);
  console.log("Questions count:", project.questions.length);
  for (const q of project.questions) {
    console.log(`- ID: ${q.id}, Text: "${q.originalText}", Category: ${q.category}, Status: ${q.status}`);
  }
}

main().catch(err => {
  console.error(err);
}).finally(async () => {
  await prisma.$disconnect();
});
