import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { env } from "./env.js";

const client = new MongoClient(env.databaseUrl);
let database: Db | null = null;

export type UserDoc = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "VENDOR";
  createdAt: Date;
  updatedAt: Date;
};

export type VendorDoc = {
  id: string;
  userId: string;
  brandName: string;
  category: string;
  city: string;
  bio: string;
  phone: string;
  priceFrom: number;
  coverageRadius: number;
  responseMinutes: number;
  rating: number;
  isVerified: boolean;
  specialties: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

export type InquiryDoc = {
  id: string;
  vendorId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: Date;
  location: string;
  guestCount: number;
  budget: number;
  status: string;
  priority: string;
  notes: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function connectDb() {
  if (database) return database;
  await client.connect();
  // If connection string contains a default db, use that instead
  try {
    const parsed = new URL(env.databaseUrl);
    if (parsed.pathname && parsed.pathname !== "/") {
      const name = parsed.pathname.replace("/", "");
      database = client.db(name || "starvnt");
    } else {
      database = client.db("starvnt");
    }
  } catch {
    database = client.db("starvnt");
  }

  return database;
}

export async function collections() {
  const db = await connectDb();
  return {
    users: db.collection<UserDoc>("users"),
    vendors: db.collection<VendorDoc>("vendors"),
    inquiries: db.collection<InquiryDoc>("inquiries"),
  };
}

export function makeId() {
  return new ObjectId().toString();
}

export async function disconnectDb() {
  await client.close();
  database = null;
}
