import { db } from "./db";
import { users, products, productVariants, inventory } from "../shared/schema";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    // Create demo users
    const hashedPassword = await bcrypt.hash("demo123", 10);

    const demoUsers = await db.insert(users).values([
      {
        name: "Admin User",
        email: "admin@kiranaconnect.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
        region: "Mumbai",
        isActive: true
      },
      {
        name: "Ravi Kumar",
        email: "vendor@example.com", 
        password: await bcrypt.hash("vendor123", 10),
        phone: "+91 98765 43210",
        role: "vendor",
        shopName: "Kumar General Store",
        region: "Mumbai",
        isActive: true
      },
      {
        name: "Priya Sharma",
        email: "retail@example.com",
        password: await bcrypt.hash("retail123", 10),
        phone: "+91 98765 67890",
        role: "retail_user",
        region: "Chennai",
        isActive: true
      }
    ]).returning();

    // Create demo products
    const demoProducts = await db.insert(products).values([
      {
        name: "Basmati Rice",
        description: "Premium quality basmati rice",
        category: "Grains",
        stock: 500,
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c",
        tags: ["rice", "basmati", "premium"],
        targetUsers: ["vendor", "retail_user"],
        isActive: true
      },
      {
        name: "Atta Flour",
        description: "Whole wheat flour for chapati",
        category: "Flour",
        stock: 300,
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b",
        tags: ["flour", "wheat", "atta"],
        targetUsers: ["vendor", "retail_user"],
        isActive: true
      },
      {
        name: "Mustard Oil",
        description: "Pure mustard cooking oil",
        category: "Oil",
        stock: 200,
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
        tags: ["oil", "mustard", "cooking"],
        targetUsers: ["vendor", "retail_user"],
        isActive: true
      },
      {
        name: "Turmeric Powder",
        description: "Pure turmeric powder",
        category: "Spices",
        stock: 150,
        imageUrl: "https://images.unsplash.com/photo-1615485925161-c4415b4a1b28",
        tags: ["spices", "turmeric", "powder"],
        targetUsers: ["vendor", "retail_user"],
        isActive: true
      },
      {
        name: "Red Lentils (Masoor Dal)",
        description: "Premium red lentils",
        category: "Pulses",
        stock: 400,
        imageUrl: "https://images.unsplash.com/photo-1596040832842-3c986a1c3a74",
        tags: ["dal", "lentils", "masoor"],
        targetUsers: ["vendor", "retail_user"],
        isActive: true
      }
    ]).returning();

    // Create product variants
    for (const product of demoProducts) {
      await db.insert(productVariants).values([
        {
          productId: product.id,
          label: "1kg",
          price: "50.00",
          bulkPrice: "45.00",
          minBulkQuantity: 10,
          unit: "kg"
        },
        {
          productId: product.id,
          label: "5kg",
          price: "240.00",
          bulkPrice: "220.00",
          minBulkQuantity: 5,
          unit: "kg"
        },
        {
          productId: product.id,
          label: "25kg",
          price: "1150.00",
          bulkPrice: "1050.00",
          minBulkQuantity: 2,
          unit: "kg"
        }
      ]);

      // Create inventory for each product
      await db.insert(inventory).values({
        productId: product.id,
        availableQuantity: product.stock,
        soldQuantity: 0,
        returnedQuantity: 0,
        minStockLevel: 50
      });
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}