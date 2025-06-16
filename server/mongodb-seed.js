import { User, Product, ProductVariant, Order, Inventory } from "@shared/mongodb-schema";
import { connectToMongoDB } from "./mongodb";
import bcrypt from "bcrypt";

export async function seedMongoDB() {
  try {
    await connectToMongoDB();
    
    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding MongoDB database...');

    // Create users
    const adminUser = new User({
      username: 'admin',
      email: 'admin@kiranaconnect.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      isActive: true,
      phone: '+91-9876543210',
      address: 'Admin Office, Business District',
      region: 'Central'
    });
    await adminUser.save();

    const kiranaUser = new User({
      username: 'kirana_owner',
      email: 'vendor@example.com',
      password: await bcrypt.hash('vendor123', 10),
      role: 'kirana',
      isActive: true,
      phone: '+91-9876543211',
      address: 'Shop No. 123, Market Street',
      region: 'North'
    });
    await kiranaUser.save();

    const retailUser = new User({
      username: 'retail_customer',
      email: 'retail@example.com',
      password: await bcrypt.hash('retail123', 10),
      role: 'retail',
      isActive: true,
      phone: '+91-9876543212',
      address: 'Apt 45B, Residential Area',
      region: 'South'
    });
    await retailUser.save();

    // Create products
    const products = [
      {
        name: 'Basmati Rice Premium',
        description: 'High-quality aged basmati rice, perfect for biryanis and special occasions',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        category: 'Rice & Grains',
        stock: 500,
        price: 120,
        unit: 'kg',
        tags: ['premium', 'basmati', 'rice'],
        targetUsers: ['retail', 'bulk']
      },
      {
        name: 'Organic Wheat Flour',
        description: 'Stone-ground organic wheat flour, perfect for rotis and bread',
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        category: 'Flour & Grains',
        stock: 300,
        price: 45,
        unit: 'kg',
        tags: ['organic', 'wheat', 'flour'],
        targetUsers: ['retail', 'bulk']
      },
      {
        name: 'Toor Dal (Arhar)',
        description: 'Premium quality toor dal, rich in protein and essential nutrients',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400',
        category: 'Lentils & Pulses',
        stock: 400,
        price: 85,
        unit: 'kg',
        tags: ['dal', 'protein', 'pulses'],
        targetUsers: ['retail', 'bulk']
      },
      {
        name: 'Red Chili Powder',
        description: 'Pure and spicy red chili powder, adds perfect heat to your dishes',
        imageUrl: 'https://images.unsplash.com/photo-1505253213348-cd54c92b37ed?w=400',
        category: 'Spices',
        stock: 200,
        price: 180,
        unit: 'kg',
        tags: ['spicy', 'chili', 'powder'],
        targetUsers: ['retail', 'bulk']
      },
      {
        name: 'Mustard Oil',
        description: 'Cold-pressed mustard oil, ideal for cooking and traditional preparations',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        category: 'Oil & Ghee',
        stock: 150,
        price: 140,
        unit: 'liter',
        tags: ['mustard', 'oil', 'cold-pressed'],
        targetUsers: ['retail', 'bulk']
      },
      {
        name: 'Pure Desi Ghee',
        description: 'Traditional cow ghee made from pure milk, rich in flavor and nutrients',
        imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
        category: 'Oil & Ghee',
        stock: 100,
        price: 450,
        unit: 'kg',
        tags: ['ghee', 'pure', 'traditional'],
        targetUsers: ['retail']
      }
    ];

    const savedProducts = [];
    for (const productData of products) {
      const product = new Product(productData);
      const savedProduct = await product.save();
      savedProducts.push(savedProduct);

      // Create inventory for each product
      const inventory = new Inventory({
        productId: savedProduct._id,
        stock: productData.stock,
        minStock: 20,
        location: 'Main Warehouse'
      });
      await inventory.save();
    }

    // Create sample orders
    const sampleOrder1 = new Order({
      userId: kiranaUser._id,
      items: [
        {
          productId: savedProducts[0]._id,
          quantity: 5,
          price: 120,
          name: 'Basmati Rice Premium'
        },
        {
          productId: savedProducts[2]._id,
          quantity: 3,
          price: 85,
          name: 'Toor Dal (Arhar)'
        }
      ],
      totalAmount: 855,
      status: 'delivered',
      shippingAddress: 'Shop No. 123, Market Street',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    await sampleOrder1.save();

    const sampleOrder2 = new Order({
      userId: retailUser._id,
      items: [
        {
          productId: savedProducts[1]._id,
          quantity: 2,
          price: 45,
          name: 'Organic Wheat Flour'
        },
        {
          productId: savedProducts[5]._id,
          quantity: 1,
          price: 450,
          name: 'Pure Desi Ghee'
        }
      ],
      totalAmount: 540,
      status: 'processing',
      shippingAddress: 'Apt 45B, Residential Area',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await sampleOrder2.save();

    console.log('MongoDB database seeded successfully!');
    console.log('Users created:');
    console.log('- Admin: admin@kiranaconnect.com / admin123');
    console.log('- Kirana: vendor@example.com / vendor123');
    console.log('- Retail: retail@example.com / retail123');
    console.log(`- ${savedProducts.length} products created`);
    console.log('- Sample orders and inventory created');

  } catch (error) {
    console.error('Error seeding MongoDB:', error);
    throw error;
  }
}