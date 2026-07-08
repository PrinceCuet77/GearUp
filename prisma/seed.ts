import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import net from 'net';

net.setDefaultAutoSelectFamily(false);

dotenv.config({ path: path.join(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// hash user passwords before inserting
async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('Seeding database...\n');

  // --- USERS ---
  const plainPassword = 'Password123!';
  const hashedPassword = await hashPassword(plainPassword);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@gearup.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const provider1 = await prisma.user.create({
    data: {
      name: 'Summit Sports Co.',
      email: 'provider1@gearup.com',
      password: hashedPassword,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      name: 'TrailBlaze Rentals',
      email: 'provider2@gearup.com',
      password: hashedPassword,
      role: 'PROVIDER',
      status: 'ACTIVE',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'customer1@gearup.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'customer2@gearup.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: 'Charlie Davis',
      email: 'customer3@gearup.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  const suspendedCustomer = await prisma.user.create({
    data: {
      name: 'Suspended User',
      email: 'suspended@gearup.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'SUSPENDED',
    },
  });

  console.log('Created 7 users');
  console.log('All passwords are: ' + plainPassword + '\n');

  // --- CATEGORIES ---

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Camping',
        description:
          'Tents, sleeping bags, camping stoves, and other camping essentials.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Hiking',
        description:
          'Backpacks, trekking poles, hiking boots, and trail accessories.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Cycling',
        description: 'Mountain bikes, road bikes, helmets, and cycling gear.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Water Sports',
        description:
          'Kayaks, surfboards, paddleboards, and snorkeling equipment.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Winter Sports',
        description: 'Skis, snowboards, snow boots, and winter apparel.',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Climbing',
        description: 'Ropes, harnesses, carabiners, and climbing shoes.',
      },
    }),
  ]);

  const [camping, hiking, cycling, waterSports, winterSports, climbing] =
    categories;

  console.log('Created 6 categories\n');

  // --- GEAR ITEMS ---

  // provider1 (Summit Sports) stuff
  const gearItem1 = await prisma.gearItem.create({
    data: {
      name: 'Alpine Pro 4-Person Tent',
      description:
        'Lightweight 4-season tent with excellent wind resistance. Sleeps 4 comfortably.',
      price: 45.0,
      stock: 8,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75',
      ]),
      providerId: provider1.id,
      categoryId: camping.id,
    },
  });

  const gearItem2 = await prisma.gearItem.create({
    data: {
      name: 'Thermal Sleeping Bag (-10°C)',
      description: 'Down-filled sleeping bag rated to -10°C. Compact and warm.',
      price: 25.0,
      stock: 12,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1487730116645-74489c95b41b',
      ]),
      providerId: provider1.id,
      categoryId: camping.id,
    },
  });

  const gearItem3 = await prisma.gearItem.create({
    data: {
      name: 'Carbon Trekking Poles (Pair)',
      description: 'Ultralight carbon fiber trekking poles with cork grips.',
      price: 15.0,
      stock: 20,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551632811-561732d1e306',
      ]),
      providerId: provider1.id,
      categoryId: hiking.id,
    },
  });

  const gearItem4 = await prisma.gearItem.create({
    data: {
      name: '50L Hiking Backpack',
      description:
        'Ergonomic 50L backpack with rain cover. Perfect for multi-day treks.',
      price: 20.0,
      stock: 15,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
      ]),
      providerId: provider1.id,
      categoryId: hiking.id,
    },
  });

  // provider2 (TrailBlaze Rentals) stuff
  const gearItem5 = await prisma.gearItem.create({
    data: {
      name: 'Mountain Bike — Full Suspension',
      description:
        '29er full suspension MTB. Shimano XT groupset, 150mm travel.',
      price: 60.0,
      stock: 5,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0',
      ]),
      providerId: provider2.id,
      categoryId: cycling.id,
    },
  });

  const gearItem6 = await prisma.gearItem.create({
    data: {
      name: 'Road Bike — Carbon Frame',
      description: 'Lightweight carbon road bike. Shimano 105 groupset.',
      price: 55.0,
      stock: 4,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e',
      ]),
      providerId: provider2.id,
      categoryId: cycling.id,
    },
  });

  const gearItem7 = await prisma.gearItem.create({
    data: {
      name: 'Inflatable Kayak (2-Person)',
      description: 'Durable inflatable kayak with pump and paddles included.',
      price: 35.0,
      stock: 6,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1472745942893-4b9f730c7668',
      ]),
      providerId: provider2.id,
      categoryId: waterSports.id,
    },
  });

  const gearItem8 = await prisma.gearItem.create({
    data: {
      name: 'Stand-Up Paddleboard',
      description: '10\'6" inflatable SUP with adjustable paddle and leash.',
      price: 30.0,
      stock: 8,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1531722569936-825d3dd91b15',
      ]),
      providerId: provider2.id,
      categoryId: waterSports.id,
    },
  });

  const gearItem9 = await prisma.gearItem.create({
    data: {
      name: 'Alpine Ski Package',
      description: 'Skis + boots + poles. Intermediate level, 160cm.',
      price: 50.0,
      stock: 6,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551524559-8af4e6624178',
      ]),
      providerId: provider2.id,
      categoryId: winterSports.id,
    },
  });

  const gearItem10 = await prisma.gearItem.create({
    data: {
      name: 'Climbing Harness + Rope Kit',
      description:
        'UIAA-certified harness with 60m dynamic rope and belay device.',
      price: 40.0,
      stock: 10,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1522163182402-834f871fd851',
      ]),
      providerId: provider1.id,
      categoryId: climbing.id,
    },
  });

  // inactive gear item, provider deactivated this one
  const gearItem11 = await prisma.gearItem.create({
    data: {
      name: 'Old Camping Lantern (Deprecated)',
      description: 'Battery-powered lantern. No longer maintained.',
      price: 5.0,
      stock: 0,
      isActive: false,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75',
      ]),
      providerId: provider1.id,
      categoryId: camping.id,
    },
  });

  console.log('Created 11 gear items (10 active, 1 inactive)\n');

  // --- RENTAL ORDERS & ORDER ITEMS ---

  // order 1 - full lifecycle completed, alice rented camping gear
  const order1 = await prisma.rentalOrder.create({
    data: {
      status: 'RETURNED',
      startDate: new Date('2026-06-20'),
      endDate: new Date('2026-06-25'),
      amount: 115.0,
      customerId: customer1.id,
    },
  });

  const orderItem1a = await prisma.rentalOrderItem.create({
    data: {
      quantity: 1,
      price: 45.0,
      rentalOrderId: order1.id,
      gearItemId: gearItem1.id,
    },
  });

  const orderItem1b = await prisma.rentalOrderItem.create({
    data: {
      quantity: 1,
      price: 25.0,
      rentalOrderId: order1.id,
      gearItemId: gearItem2.id,
    },
  });

  const orderItem1c = await prisma.rentalOrderItem.create({
    data: {
      quantity: 1,
      price: 15.0,
      rentalOrderId: order1.id,
      gearItemId: gearItem3.id,
    },
  });

  // order 2 - paid but not picked up yet, 2 mountain bikes
  const order2 = await prisma.rentalOrder.create({
    data: {
      status: 'PAID',
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-07-14'),
      amount: 120.0,
      customerId: customer1.id,
    },
  });

  const orderItem2a = await prisma.rentalOrderItem.create({
    data: {
      quantity: 2,
      price: 60.0,
      rentalOrderId: order2.id,
      gearItemId: gearItem5.id,
    },
  });

  // order 3 - bob confirmed, awaiting payment, kayak rental
  const order3 = await prisma.rentalOrder.create({
    data: {
      status: 'CONFIRMED',
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-18'),
      amount: 70.0,
      customerId: customer2.id,
    },
  });

  const orderItem3a = await prisma.rentalOrderItem.create({
    data: {
      quantity: 2,
      price: 35.0,
      rentalOrderId: order3.id,
      gearItemId: gearItem7.id,
    },
  });

  // order 4 - just placed, payment failed
  const order4 = await prisma.rentalOrder.create({
    data: {
      status: 'PLACED',
      startDate: new Date('2026-07-20'),
      endDate: new Date('2026-07-25'),
      amount: 100.0,
      customerId: customer2.id,
    },
  });

  const orderItem4a = await prisma.rentalOrderItem.create({
    data: {
      quantity: 2,
      price: 50.0,
      rentalOrderId: order4.id,
      gearItemId: gearItem9.id,
    },
  });

  // order 5 - charlie has the gear out right now
  const order5 = await prisma.rentalOrder.create({
    data: {
      status: 'PICKED_UP',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-08'),
      amount: 60.0,
      customerId: customer3.id,
    },
  });

  const orderItem5a = await prisma.rentalOrderItem.create({
    data: {
      quantity: 1,
      price: 40.0,
      rentalOrderId: order5.id,
      gearItemId: gearItem10.id,
    },
  });

  // order 6 - cancelled
  const order6 = await prisma.rentalOrder.create({
    data: {
      status: 'CANCELLED',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-06-18'),
      amount: 30.0,
      customerId: customer3.id,
    },
  });

  const orderItem6a = await prisma.rentalOrderItem.create({
    data: {
      quantity: 1,
      price: 30.0,
      rentalOrderId: order6.id,
      gearItemId: gearItem8.id,
    },
  });

  console.log('Created 6 rental orders with 8 order items\n');

  // --- PAYMENTS ---

  // completed payment for order1 (stripe)
  await prisma.payment.create({
    data: {
      transactionId: 'txn_gearup_001_completed',
      amount: 115.0,
      status: 'COMPLETED',
      paidAt: new Date('2026-06-19T14:30:00Z'),
      gatewayResponse: {
        provider: 'stripe',
        chargeId: 'ch_1NkL8a2eZvKYlo2CeRjQ3qEg',
        receiptUrl: 'https://pay.stripe.com/receipts/xxx',
      },
      rentalOrderId: order1.id,
    },
  });

  // completed payment for order2 (sslcommerz)
  await prisma.payment.create({
    data: {
      transactionId: 'txn_gearup_002_completed',
      amount: 120.0,
      status: 'COMPLETED',
      paidAt: new Date('2026-07-06T09:15:00Z'),
      gatewayResponse: {
        provider: 'sslcommerz',
        transactionId: 'ssl_txn_abc123',
        bankTxn: 'ABC BANK TXN 456',
      },
      rentalOrderId: order2.id,
    },
  });

  // completed payment for order5 (stripe)
  await prisma.payment.create({
    data: {
      transactionId: 'txn_gearup_005_completed',
      amount: 60.0,
      status: 'COMPLETED',
      paidAt: new Date('2026-06-30T16:00:00Z'),
      gatewayResponse: {
        provider: 'stripe',
        chargeId: 'ch_1NkL8a2eZvKYlo2CeRjQ4dE',
      },
      rentalOrderId: order5.id,
    },
  });

  // pending payment for order3
  await prisma.payment.create({
    data: {
      transactionId: 'txn_gearup_003_pending',
      amount: 70.0,
      status: 'PENDING',
      rentalOrderId: order3.id,
    },
  });

  // failed payment for order4
  await prisma.payment.create({
    data: {
      transactionId: 'txn_gearup_004_failed',
      amount: 100.0,
      status: 'FAILED',
      gatewayResponse: {
        provider: 'sslcommerz',
        error: 'Insufficient funds',
        errorCode: 'INSUFFICIENT_FUNDS',
      },
      rentalOrderId: order4.id,
    },
  });

  console.log('Created 5 payments (3 completed, 1 pending, 1 failed)\n');

  // --- REVIEWS ---
  // alice reviewing her returned order gear
  await prisma.review.create({
    data: {
      rating: 5,
      comment:
        'Excellent tent! Kept us warm and dry during a rainstorm. Highly recommend.',
      customerId: customer1.id,
      gearItemId: gearItem1.id,
      rentalOrderId: order1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment:
        'Great sleeping bag, very compact. Slightly tight for tall people.',
      customerId: customer1.id,
      gearItemId: gearItem2.id,
      rentalOrderId: order1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Lightweight and sturdy. Perfect for the trail.',
      customerId: customer1.id,
      gearItemId: gearItem3.id,
      rentalOrderId: order1.id,
    },
  });

  // charlie reviewing climbing gear even though order is still active
  await prisma.review.create({
    data: {
      rating: 4,
      comment:
        'Solid harness and rope combo. Belay device works smoothly. Would rent again.',
      customerId: customer3.id,
      gearItemId: gearItem10.id,
      rentalOrderId: order5.id,
    },
  });

  console.log('Created 4 reviews\n');

  console.log('--- Seed done ---');
  console.log('Users: 7 (1 admin, 2 providers, 4 customers)');
  console.log('Categories: 6');
  console.log('Gear Items: 11');
  console.log('Orders: 6');
  console.log('Payments: 5');
  console.log('Reviews: 4');
  console.log('');
  console.log('Login credentials (same password for all):');
  console.log('  Password: Password123!');
  console.log('  Admin:     admin@gearup.com');
  console.log('  Provider1: provider1@gearup.com');
  console.log('  Provider2: provider2@gearup.com');
  console.log('  Customer1: customer1@gearup.com');
  console.log('  Customer2: customer2@gearup.com');
  console.log('  Customer3: customer3@gearup.com');
  console.log('  Suspended: suspended@gearup.com');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
