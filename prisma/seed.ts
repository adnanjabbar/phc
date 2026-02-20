import { PrismaClient, UserRole, FacilityCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create REGX super admin
  const regxPassword = await bcrypt.hash("RegX@2026", 12);
  const regxUser = await prisma.user.upsert({
    where: { email: "regx@phc-msds.com" },
    update: {},
    create: {
      email: "regx@phc-msds.com",
      username: "regx",
      password: regxPassword,
      fullName: "REGX Super Admin",
      role: UserRole.REGX,
      isActive: true,
    },
  });
  console.log("Created REGX user:", regxUser.username);

  // Create sample Admin user first (without facilityId)
  const adminPassword = await bcrypt.hash("Admin@2026", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@lahoregeneral.com" },
    update: {},
    create: {
      email: "admin@lahoregeneral.com",
      username: "lghadmin",
      password: adminPassword,
      fullName: "Lahore General Hospital Admin",
      phone: "042-99200000",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log("Created Admin user:", adminUser.username);

  // Create sample facility
  const facility = await prisma.facility.upsert({
    where: { registrationNo: "LHR-CAT1-001" },
    update: {},
    create: {
      name: "Lahore General Hospital",
      category: FacilityCategory.HOSPITAL_CAT_1,
      registrationNo: "LHR-CAT1-001",
      address: "Ferozepur Road, Lahore",
      city: "Lahore",
      district: "Lahore",
      province: "Punjab",
      phone: "042-99200000",
      email: "admin@lahoregeneral.com",
      bedCount: 1000,
      isActive: true,
      adminId: adminUser.id,
    },
  });
  console.log("Created facility:", facility.name);

  // Update admin user with facilityId
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { facilityId: facility.id },
  });

  // Create sample MSDS Focal Person
  const focalPassword = await bcrypt.hash("Focal@2026", 12);
  const focalUser = await prisma.user.upsert({
    where: { email: "focal@lahoregeneral.com" },
    update: {},
    create: {
      email: "focal@lahoregeneral.com",
      username: "lghfocal",
      password: focalPassword,
      fullName: "MSDS Focal Person LGH",
      phone: "042-99200001",
      role: UserRole.MSDS_FOCAL,
      isActive: true,
      facilityId: facility.id,
    },
  });
  console.log("Created MSDS Focal user:", focalUser.username);

  console.log("Database seeded successfully!");
  console.log("\nDefault credentials:");
  console.log("REGX Super Admin - Username: regx, Password: RegX@2026");
  console.log("Facility Admin - Username: lghadmin, Password: Admin@2026");
  console.log("MSDS Focal - Username: lghfocal, Password: Focal@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
