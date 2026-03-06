const { PrismaClient } = require("../node_modules/@prisma/client");
process.env.DATABASE_URL =
  "postgresql://postgres:password@localhost:5432/lyrgenic";
const p = new PrismaClient();
async function main() {
  const projects = await p.project.findMany({
    select: { id: true, status: true, name: true },
  });
  console.log("PROJECTS:", JSON.stringify(projects, null, 2));
  const versions = await p.lyricsVersion.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      projectId: true,
      versionNumber: true,
      lyricsJson: true,
    },
  });
  console.log("VERSIONS count:", versions.length);
  if (versions.length > 0) {
    console.log(
      "LATEST VERSION lyricsJson type:",
      typeof versions[0].lyricsJson,
    );
    console.log(
      "LATEST VERSION lyricsJson sample:",
      JSON.stringify(versions[0].lyricsJson)?.substring(0, 400),
    );
  }
  await p.$disconnect();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
