import crypto from "node:crypto";
import type { Db } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export type AuthUser = {
  createdAt: string;
  email: string;
  id: string;
  name?: string;
  phone?: string;
  updatedAt: string;
};

type AuthUserDocument = AuthUser & {
  passwordHash: string;
  passwordIterations: number;
  passwordSalt: string;
};

type AuthSessionDocument = {
  createdAt: string;
  expiresAt: string;
  id: string;
  lastSeenAt: string;
  tokenHash: string;
  userId: string;
};

export const authCookieName = "medivault_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;
const passwordIterations = 210_000;
const passwordKeyLength = 32;
const passwordDigest = "sha256";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) return digits.slice(-10);
  return digits;
}

function isValidPhone(phone: string) {
  return normalizePhone(phone).length >= 10;
}

function cleanName(email: string, name?: string) {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;
  return email.split("@")[0] || "MediVault user";
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex"), iterations = passwordIterations) {
  const hash = crypto.pbkdf2Sync(password, salt, iterations, passwordKeyLength, passwordDigest).toString("hex");
  return { hash, iterations, salt };
}

function verifyPassword(password: string, user: AuthUserDocument) {
  const candidate = hashPassword(password, user.passwordSalt, user.passwordIterations).hash;
  const expected = Buffer.from(user.passwordHash, "hex");
  const received = Buffer.from(candidate, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user: AuthUserDocument): AuthUser {
  return {
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    name: user.name,
    phone: user.phone,
    updatedAt: user.updatedAt,
  };
}

async function ensureAuthIndexes(db: Db) {
  await Promise.all([
    db.collection("authUsers").createIndex({ email: 1 }, { unique: true }),
    db.collection("authUsers").createIndex({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } }),
    db.collection("authUsers").createIndex({ id: 1 }, { unique: true }),
    db.collection("authSessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("authSessions").createIndex({ userId: 1 }),
    db.collection("authSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function createSession(db: Db, userId: string) {
  const token = createToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionMaxAgeSeconds * 1000).toISOString();
  const session: AuthSessionDocument = {
    id: `session-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
    createdAt: now.toISOString(),
    expiresAt,
    lastSeenAt: now.toISOString(),
    tokenHash: hashToken(token),
    userId,
  };
  await db.collection<AuthSessionDocument>("authSessions").insertOne(session);
  return token;
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(authCookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(authCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function tokenFromRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(authCookieName)?.value;
  if (cookieToken) return cookieToken;
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  if (!isMongoConfigured()) return null;
  const token = tokenFromRequest(request);
  if (!token || token === "mongo-cookie-session") return null;

  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const now = new Date().toISOString();
  const session = await db.collection<AuthSessionDocument>("authSessions").findOne(
    {
      tokenHash: hashToken(token),
      expiresAt: { $gt: now },
    },
    { projection: { _id: 0 } },
  );

  if (!session) return null;

  const user = await db.collection<AuthUserDocument>("authUsers").findOne({ id: session.userId }, { projection: { _id: 0 } });
  if (!user) return null;

  await db.collection<AuthSessionDocument>("authSessions").updateOne(
    { id: session.id },
    {
      $set: {
        lastSeenAt: now,
      },
    },
  );

  return publicUser(user);
}

export async function getAuthenticatedUserId(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return user?.id ?? null;
}

export async function createAuthUserSession(input: { email: string; name?: string; password: string; phone: string }) {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  if (!isValidEmail(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (!isValidPhone(phone)) {
    throw new Error("Enter a valid mobile number.");
  }
  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const existing = await db.collection<AuthUserDocument>("authUsers").findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    throw new Error(existing.phone === phone ? "An account with this mobile number already exists." : "An account with this email already exists.");
  }

  const now = new Date().toISOString();
  const password = hashPassword(input.password);
  const user: AuthUserDocument = {
    id: `user-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
    createdAt: now,
    email,
    name: cleanName(email, input.name),
    passwordHash: password.hash,
    passwordIterations: password.iterations,
    passwordSalt: password.salt,
    phone,
    updatedAt: now,
  };

  await db.collection<AuthUserDocument>("authUsers").insertOne(user);
  const token = await createSession(db, user.id);
  return { token, user: publicUser(user) };
}

export async function loginAuthUserSession(input: { password: string; phone: string }) {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  const phone = normalizePhone(input.phone);
  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const emailFallback = normalizeEmail(input.phone);
  const user = await db.collection<AuthUserDocument>("authUsers").findOne(
    isValidEmail(emailFallback) ? { $or: [{ phone }, { email: emailFallback }] } : { phone },
    { projection: { _id: 0 } },
  );
  if (!user || !verifyPassword(input.password, user)) {
    throw new Error("Invalid mobile number or password.");
  }

  const token = await createSession(db, user.id);
  return { token, user: publicUser(user) };
}

export async function destroyAuthSession(request: NextRequest) {
  if (!isMongoConfigured()) return;
  const token = tokenFromRequest(request);
  if (!token) return;
  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  await db.collection<AuthSessionDocument>("authSessions").deleteOne({ tokenHash: hashToken(token) });
}
