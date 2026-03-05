const { PrismaClient } = require("../node_modules/@prisma/client");
const p = new PrismaClient();
async function main() {
  const proj = await p.project.findMany({
    select: { id: true, name: true, status: true },
  });
  console.log("Projects:", JSON.stringify(proj, null, 2));
  const lv = await p.lyricsVersion.findMany({
    select: { id: true, projectId: true, versionNumber: true },
  });
  console.log("LyricsVersions:", JSON.stringify(lv, null, 2));
}
main()
  .catch(console.error)
  .finally(() => p.$disconnect());
