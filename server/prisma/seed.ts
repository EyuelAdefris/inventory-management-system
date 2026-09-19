import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing records (optional for clean seeding)
  await prisma.stockAdjustment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const adminPasswordHash = await bcrypt.hash("password123", 10);
  const staffPasswordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      username: "admin",
      email: "admin@inventory.com",
      password: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: "Staff User",
      username: "staff",
      email: "staff@inventory.com",
      password: staffPasswordHash,
      role: Role.STAFF,
    },
  });

  console.log(`✅ Seeded 2 users: ${adminUser.username} (ADMIN), ${staffUser.username} (STAFF)`);

  // 3. Seed Categories
  const categoryElectronics = await prisma.category.create({
    data: {
      name: "Electronics",
      description: "Computer hardware, peripherals, and high-tech gadgets.",
    },
  });

  const categoryOffice = await prisma.category.create({
    data: {
      name: "Office Supplies",
      description: "Paper, writing utensils, and desk organization items.",
    },
  });

  const categoryFurniture = await prisma.category.create({
    data: {
      name: "Furniture",
      description: "Ergonomic chairs, standing desks, and office storage solutions.",
    },
  });

  console.log("✅ Seeded 3 categories.");

  // 4. Seed Suppliers
  const supplierTech = await prisma.supplier.create({
    data: {
      name: "TechDistro Inc",
      contactPerson: "Alice Johnson",
      email: "contact@techdistro.com",
      phone: "+1-555-0199",
      address: "100 Tech Blvd, Silicon Valley, CA",
    },
  });

  const supplierGlobal = await prisma.supplier.create({
    data: {
      name: "GlobalStationery",
      contactPerson: "Bob Smith",
      email: "orders@globalstationery.com",
      phone: "+1-555-0244",
      address: "45 Supply Way, Chicago, IL",
    },
  });

  const supplierErgo = await prisma.supplier.create({
    data: {
      name: "Ergonomic Living",
      contactPerson: "Carol Davis",
      email: "sales@ergoliving.com",
      phone: "+1-555-0388",
      address: "789 Comfort Ave, Austin, TX",
    },
  });

  console.log("✅ Seeded 3 suppliers.");

  // 5. Seed Customers
  await prisma.customer.createMany({
    data: [
      {
        name: "Acme Corp",
        email: "billing@acme.com",
        phone: "+1-555-1001",
        address: "1 Corporate Dr, New York, NY",
      },
      {
        name: "TechStart Labs",
        email: "hello@techstart.io",
        phone: "+1-555-1002",
        address: "50 Innovation Way, San Francisco, CA",
      },
      {
        name: "Apex Retail",
        email: "procurement@apexretail.com",
        phone: "+1-555-1003",
        address: "22 Market St, Seattle, WA",
      },
      {
        name: "Quantum Dynamics",
        email: "info@quantumdyn.com",
        phone: "+1-555-1004",
        address: "400 Research Pkwy, Boston, MA",
      },
      {
        name: "Horizon Media",
        email: "accounts@horizonmedia.com",
        phone: "+1-555-1005",
        address: "12 Studio Row, Los Angeles, CA",
      },
    ],
  });

  console.log("✅ Seeded 5 customers.");

  // 6. Seed Products
  const productsData = [
    {
      name: "Wireless Mechanical Keyboard",
      sku: "ELEC-001",
      description: "Tactile RGB mechanical keyboard with Bluetooth and 2.4G connectivity.",
      categoryId: categoryElectronics.id,
      supplierId: supplierTech.id,
      costPrice: 45.0,
      sellingPrice: 89.99,
      stockQuantity: 50,
      minStockLevel: 10,
    },
    {
      name: "UltraWide 34\" Curved Monitor",
      sku: "ELEC-002",
      description: "WQHD 144Hz curved display with USB-C power delivery.",
      categoryId: categoryElectronics.id,
      supplierId: supplierTech.id,
      costPrice: 280.0,
      sellingPrice: 449.99,
      stockQuantity: 15,
      minStockLevel: 5,
    },
    {
      name: "USB-C Docking Station 11-in-1",
      sku: "ELEC-003",
      description: "Multi-port adapter with dual HDMI, Ethernet, and 100W PD charging.",
      categoryId: categoryElectronics.id,
      supplierId: supplierTech.id,
      costPrice: 35.0,
      sellingPrice: 69.99,
      stockQuantity: 40,
      minStockLevel: 8,
    },
    {
      name: "Premium Recycled A4 Copy Paper (Box of 5)",
      sku: "OFF-001",
      description: "High-whiteness 80gsm recycled copy paper for everyday printing.",
      categoryId: categoryOffice.id,
      supplierId: supplierGlobal.id,
      costPrice: 18.0,
      sellingPrice: 34.99,
      stockQuantity: 120,
      minStockLevel: 25,
    },
    {
      name: "Ergonomic Gel Pen Set 12-Pack",
      sku: "OFF-002",
      description: "Quick-drying black ink gel pens with comfortable rubber grip.",
      categoryId: categoryOffice.id,
      supplierId: supplierGlobal.id,
      costPrice: 4.5,
      sellingPrice: 12.99,
      stockQuantity: 200,
      minStockLevel: 30,
    },
    {
      name: "Heavy-Duty Metal Stapler",
      sku: "OFF-003",
      description: "Full-strip desk stapler capable of stapling up to 50 sheets.",
      categoryId: categoryOffice.id,
      supplierId: supplierGlobal.id,
      costPrice: 8.0,
      sellingPrice: 19.99,
      stockQuantity: 75,
      minStockLevel: 15,
    },
    {
      name: "Executive Ergonomic Mesh Chair",
      sku: "FUR-001",
      description: "Breathable mesh back chair with 3D armrests and lumbar support.",
      categoryId: categoryFurniture.id,
      supplierId: supplierErgo.id,
      costPrice: 150.0,
      sellingPrice: 299.99,
      stockQuantity: 20,
      minStockLevel: 4,
    },
    {
      name: "Electric Height-Adjustable Standing Desk",
      sku: "FUR-002",
      description: "Dual-motor motorized sit-stand desk frame with memory presets.",
      categoryId: categoryFurniture.id,
      supplierId: supplierErgo.id,
      costPrice: 220.0,
      sellingPrice: 419.99,
      stockQuantity: 12,
      minStockLevel: 3,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }

  console.log("✅ Seeded 8 products.");
  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
