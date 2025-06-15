import { db } from "./db.js";
import { users, products, productVariants, inventory } from "../shared/schema.js";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Starting database seeding...");

    // Create users
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const vendorPassword = await bcrypt.hash("vendor123", 10);
    const retailPassword = await bcrypt.hash("retail123", 10);

    const seedUsers = [
      {
        name: "Admin User",
        email: "admin@kiranaconnect.com",
        password: hashedPassword,
        phone: null,
        role: "admin",
        shopName: null,
        region: "Mumbai",
        isActive: true
      },
      {
        name: "Ravi Kumar",
        email: "vendor@example.com",
        password: vendorPassword,
        phone: "+91 98765 43210",
        role: "vendor",
        shopName: "Kumar General Store",
        region: "Mumbai",
        isActive: true
      },
      {
        name: "Priya Sharma",
        email: "retail@example.com",
        password: retailPassword,
        phone: "+91 87654 32109",
        role: "retail_user",
        shopName: null,
        region: "Mumbai",
        isActive: true
      }
    ];

    await db.insert(users).values(seedUsers);
    console.log("Users seeded successfully");

    // Create products
    const seedProducts = [
      {
        name: "Basmati Rice",
        category: "Grains",
        description: "Premium quality Basmati rice",
        isActive: true,
        imageUrl: null,
        stock: 100,
        tags: ["rice", "grains", "premium"],
        targetUsers: ["vendor", "retail_user"]
      },
      {
        name: "Wheat Flour",
        category: "Flour",
        description: "Whole wheat flour for daily use",
        isActive: true,
        imageUrl: null,
        stock: 80,
        tags: ["flour", "wheat", "baking"],
        targetUsers: ["vendor", "retail_user"]
      },
      {
        name: "Sugar",
        category: "Sweeteners",
        description: "Pure white crystal sugar",
        isActive: true,
        imageUrl: null,
        stock: 50,
        tags: ["sugar", "sweetener"],
        targetUsers: ["vendor", "retail_user"]
      },
      {
        name: "Cooking Oil",
        category: "Oils",
        description: "Refined sunflower cooking oil",
        isActive: true,
        imageUrl: null,
        stock: 60,
        tags: ["oil", "cooking", "sunflower"],
        targetUsers: ["vendor", "retail_user"]
      },
      {
        name: "Dal (Lentils)",
        category: "Pulses",
        description: "Mixed dal for daily cooking",
        isActive: true,
        imageUrl: null,
        stock: 75,
        tags: ["dal", "lentils", "pulses"],
        targetUsers: ["vendor", "retail_user"]
      }
    ];

    const insertedProducts = await db.insert(products).values(seedProducts).returning();
    console.log("Products seeded successfully");

    // Create product variants
    const seedVariants = [
      // Basmati Rice variants
      { productId: insertedProducts[0].id, label: "1kg", price: "50.00", bulkPrice: "45.00", minBulkQuantity: 10, unit: "kg" },
      { productId: insertedProducts[0].id, label: "5kg", price: "240.00", bulkPrice: "220.00", minBulkQuantity: 5, unit: "kg" },
      
      // Wheat Flour variants
      { productId: insertedProducts[1].id, label: "1kg", price: "40.00", bulkPrice: "35.00", minBulkQuantity: 20, unit: "kg" },
      { productId: insertedProducts[1].id, label: "5kg", price: "190.00", bulkPrice: "170.00", minBulkQuantity: 10, unit: "kg" },
      
      // Sugar variants
      { productId: insertedProducts[2].id, label: "1kg", price: "45.00", bulkPrice: "40.00", minBulkQuantity: 15, unit: "kg" },
      
      // Cooking Oil variants
      { productId: insertedProducts[3].id, label: "1L", price: "120.00", bulkPrice: "110.00", minBulkQuantity: 12, unit: "L" },
      { productId: insertedProducts[3].id, label: "5L", price: "580.00", bulkPrice: "550.00", minBulkQuantity: 6, unit: "L" },
      
      // Dal variants
      { productId: insertedProducts[4].id, label: "1kg", price: "80.00", bulkPrice: "75.00", minBulkQuantity: 10, unit: "kg" },
      { productId: insertedProducts[4].id, label: "500g", price: "42.00", bulkPrice: "38.00", minBulkQuantity: 20, unit: "g" }
    ];

    await db.insert(productVariants).values(seedVariants);
    console.log("Product variants seeded successfully");

    // Create inventory
    const seedInventory = insertedProducts.map(product => ({
      productId: product.id,
      availableQuantity: Math.floor(Math.random() * 100) + 50,
      soldQuantity: Math.floor(Math.random() * 20),
      returnedQuantity: Math.floor(Math.random() * 5),
      minStockLevel: 20,
      lastRestockDate: new Date()
    }));

    await db.insert(inventory).values(seedInventory);
    console.log("Inventory seeded successfully");

    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
}