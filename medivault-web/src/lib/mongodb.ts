import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "medivault";

type MongoGlobal = typeof globalThis & {
  _medivaultMongoClientPromise?: Promise<MongoClient>;
};

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoDb() {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const globalForMongo = globalThis as MongoGlobal;

  if (!globalForMongo._medivaultMongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._medivaultMongoClientPromise = client.connect();
  }

  const client = await globalForMongo._medivaultMongoClientPromise;
  return client.db(dbName);
}
