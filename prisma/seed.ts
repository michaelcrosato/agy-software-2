import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding FeedFlow database...");

  // 1. Clean existing data
  await prisma.changelog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feedbackPost.deleteMany();
  await prisma.epic.deleteMany();
  await prisma.board.deleteMany();
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

  // 3. Create default feedback boards
  const coreBoard = await prisma.board.create({
    data: {
      name: "💡 Core Features & Requests",
      description: "Submit and vote on feature requests for the FeedFlow application core.",
      slug: "core-features",
    },
  });

  const bugsBoard = await prisma.board.create({
    data: {
      name: "🐛 Bug Reports",
      description: "Report bugs and glitches you encounter so we can squash them.",
      slug: "bug-reports",
    },
  });

  console.log("Created boards:", [coreBoard.name, bugsBoard.name]);

  // 4. Create some Epics
  const mobileEpic = await prisma.epic.create({
    data: {
      name: "📱 Mobile App Suite",
      description: "Requests relating to iOS and Android applications.",
    },
  });

  const authEpic = await prisma.epic.create({
    data: {
      name: "🔐 Security & Authentication",
      description: "Single sign-on, multifactor security, and permission groups.",
    },
  });

  // 5. Create Feedback posts
  const post1 = await prisma.feedbackPost.create({
    data: {
      title: "Add support for Google Single Sign-On (SSO)",
      description: "It would be great to allow users to sign in using their Google Workspace accounts. This would simplify onboarding and security management for enterprise teams.",
      status: "Planned",
      category: "Feature",
      boardId: coreBoard.id,
      authorId: user1.id,
      epicId: authEpic.id,
    },
  });

  const post2 = await prisma.feedbackPost.create({
    data: {
      title: "Mobile responsive dark mode dashboard",
      description: "The mobile view of the dashboard has some issues with cards overflowing on small screens. Please fix the layout and make it fully responsive with glassmorphic design.",
      status: "In Progress",
      category: "Improvement",
      boardId: coreBoard.id,
      authorId: user2.id,
      epicId: mobileEpic.id,
    },
  });

  const post3 = await prisma.feedbackPost.create({
    data: {
      title: "Unable to upload avatars larger than 2MB",
      description: "When I try to upload a PNG avatar that is 2.5MB, it fails silently. It should show a nice validation warning and compress the image.",
      status: "Under Review",
      category: "Bug",
      boardId: bugsBoard.id,
      authorId: user3.id,
    },
  });

  const post4 = await prisma.feedbackPost.create({
    data: {
      title: "Export feedback boards as CSV/JSON formats",
      description: "Add an export button for board admins so they can download all feedback and votes into a structured file for offline spreadsheet analysis.",
      status: "Completed",
      category: "Feature",
      boardId: coreBoard.id,
      authorId: user3.id,
    },
  });

  console.log("Created feedback posts:", [post1.title, post2.title, post3.title, post4.title]);

  // 6. Create votes
  await prisma.vote.createMany({
    data: [
      { userId: user1.id, postId: post1.id },
      { userId: user2.id, postId: post1.id },
      { userId: user3.id, postId: post1.id }, // 3 votes for SSO
      
      { userId: user2.id, postId: post2.id },
      { userId: user3.id, postId: post2.id }, // 2 votes for responsive dashboard
      
      { userId: user1.id, postId: post3.id }, // 1 vote for upload bug
    ],
  });

  // 7. Create comments
  await prisma.comment.createMany({
    data: [
      {
        userId: user2.id,
        postId: post1.id,
        content: "Totally agree! We need SSO to rollout this board to our internal employees.",
      },
      {
        userId: user3.id,
        postId: post1.id,
        content: "Adding this to our security roadmap for Sprint 2. Thanks for submitting!",
      },
      {
        userId: user1.id,
        postId: post2.id,
        content: "Good catch, I notice this too on my iPhone 14 Pro Max. Will look fantastic in dark mode.",
      },
    ],
  });

  // 8. Create a sample changelog
  await prisma.changelog.create({
    data: {
      title: "🚀 Released Core Board Export Features",
      content: "We are thrilled to announce that admins can now export any feedback board as a CSV or JSON report! Navigate to your board settings and look for the 'Export Data' option in the sidebar. This makes it extremely easy to analyze votes and prioritize your roadmap offline.",
      publishedAt: new Date(),
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
