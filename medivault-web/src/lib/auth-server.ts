import crypto from "node:crypto";
import type { Db } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { validatePasswordStrength } from "@/lib/auth-policy";

export type AuthUser = {
  accountStatus?: "active" | "suspended";
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
// A local-only OTP keeps developer testing quick without exposing a production bypass.
// This must remain unreachable from every deployed environment, regardless of env vars.
const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
const testingAuthOtp = isDevelopmentEnvironment ? process.env.AUTH_TEST_OTP?.trim() || "1111" : "";
const testOtpEnabled = isDevelopmentEnvironment;
const bootstrapAdminEmail = normalizeEmail(process.env.ADMIN_BOOTSTRAP_EMAIL || "yogeshkukadiya92@gmail.com");
const bootstrapAdminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
const bootstrapAdminUserId = bootstrapAdminEmail ? `user-admin-${hashToken(bootstrapAdminEmail).slice(0, 18)}` : "";
const bootstrapAdminLabId = bootstrapAdminEmail ? `lab-admin-${hashToken(`lab:${bootstrapAdminEmail}`).slice(0, 18)}` : "";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

function isValidPhone(phone: string) {
  const digits = normalizePhone(phone);
  return digits.length >= 8 && digits.length <= 15;
}

export function verifyTestingAuthOtp(otp: string) {
  if (!testingAuthOtp || !testOtpEnabled) return false;
  const expected = Buffer.from(hashToken(testingAuthOtp), "hex");
  const received = Buffer.from(hashToken(otp.trim()), "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export function isTestingAuthOtpEnabled() {
  return Boolean(testingAuthOtp && testOtpEnabled);
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

function verifyBootstrapAdminPassword(password: string) {
  if (!bootstrapAdminEmail || !bootstrapAdminPassword) return false;
  const expected = Buffer.from(hashToken(bootstrapAdminPassword), "hex");
  const received = Buffer.from(hashToken(password), "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function publicUser(user: AuthUserDocument): AuthUser {
  return {
    accountStatus: user.accountStatus ?? "active",
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    name: user.name,
    phone: user.phone,
    updatedAt: user.updatedAt,
  };
}

export function isBootstrapAdminUser(user: Pick<AuthUser, "email" | "id"> | null | undefined) {
  return Boolean(user && user.email === bootstrapAdminEmail);
}

export function isBootstrapAdminUserId(userId: string) {
  return Boolean(userId && userId === bootstrapAdminUserId);
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

async function ensureBootstrapAdmin(db: Db, password: string) {
  if (!verifyBootstrapAdminPassword(password)) return;

  const now = new Date().toISOString();
  const existingUser = await db.collection<AuthUserDocument>("authUsers").findOne(
    { email: bootstrapAdminEmail },
    { projection: { _id: 0 } },
  );
  const userId = existingUser?.id || bootstrapAdminUserId;
  const passwordFields = hashPassword(password);

  await db.collection<AuthUserDocument>("authUsers").updateOne(
    { email: bootstrapAdminEmail },
    {
      $set: {
        email: bootstrapAdminEmail,
        accountStatus: "active",
        name: "Yogesh Admin",
        passwordHash: passwordFields.hash,
        passwordIterations: passwordFields.iterations,
        passwordSalt: passwordFields.salt,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        id: userId,
      },
    },
    { upsert: true },
  );

  await db.collection("labs").updateOne(
    { id: bootstrapAdminLabId },
    {
      $set: {
        name: "MediVault Lab",
        ownerUserId: userId,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        id: bootstrapAdminLabId,
      },
    },
    { upsert: true },
  );

  await db.collection("labUsers").updateOne(
    { labId: bootstrapAdminLabId, userId },
    {
      $set: {
        role: "lab_admin",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        id: `${bootstrapAdminLabId}:${userId}`,
        labId: bootstrapAdminLabId,
        userId,
      },
    },
    { upsert: true },
  );
}

export async function ensureBootstrapAdminWorkspace(db: Db, user: AuthUser) {
  if (!isBootstrapAdminUser(user)) {
    throw new Error("Only the owner admin can initialize the admin workspace.");
  }

  const now = new Date().toISOString();
  await db.collection("labs").updateOne(
    { id: bootstrapAdminLabId },
    {
      $set: {
        ownerUserId: user.id,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        id: bootstrapAdminLabId,
        name: "MediVault Lab",
      },
    },
    { upsert: true },
  );
  await db.collection("labUsers").updateOne(
    { labId: bootstrapAdminLabId, userId: user.id },
    {
      $set: {
        role: "lab_admin",
        workspaceAccess: ["lab", "nutrition", "body_composition", "patient_app"],
        workspaceRoles: {
          body_composition: "body_composition_admin",
          lab: "lab_admin",
          nutrition: "nutrition_admin",
          patient_app: "patient",
        },
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        id: `${bootstrapAdminLabId}:${user.id}`,
        labId: bootstrapAdminLabId,
        userId: user.id,
      },
    },
    { upsert: true },
  );
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
  if (!user || user.accountStatus === "suspended") return null;

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
  if (email === bootstrapAdminEmail) {
    throw new Error("Owner admin account cannot be created from public signup.");
  }
  if (!isValidPhone(phone)) {
    throw new Error("Enter a valid mobile number.");
  }
  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) throw new Error(passwordError);

  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const existing = await db.collection<AuthUserDocument>("authUsers").findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    throw new Error(existing.phone === phone ? "An account with this mobile number already exists." : "An account with this email already exists.");
  }

  const now = new Date().toISOString();
  const password = hashPassword(input.password);
  const user: AuthUserDocument = {
    accountStatus: "active",
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

export async function createManagedAuthUser(input: { email: string; name?: string; password: string; phone: string }) {
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
  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) throw new Error(passwordError);
  if (email === bootstrapAdminEmail) {
    throw new Error("Owner admin credentials are reserved.");
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
    accountStatus: "active",
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
  return publicUser(user);
}

export async function loginAuthUserSession(input: { password: string; phone: string }) {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  const phone = normalizePhone(input.phone);
  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const emailFallback = normalizeEmail(input.phone);
  if (emailFallback === bootstrapAdminEmail) {
    await ensureBootstrapAdmin(db, input.password);
  }
  const user = await db.collection<AuthUserDocument>("authUsers").findOne(
    isValidEmail(emailFallback) ? { $or: [{ phone }, { email: emailFallback }] } : { phone },
    { projection: { _id: 0 } },
  );
  if (!user || user.accountStatus === "suspended" || !verifyPassword(input.password, user)) {
    throw new Error("Invalid mobile/email or password.");
  }

  const token = await createSession(db, user.id);
  return { token, user: publicUser(user) };
}

async function findUserByPhone(phoneInput: string) {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  const phone = normalizePhone(phoneInput);
  if (!isValidPhone(phone)) {
    throw new Error("Enter a valid mobile number.");
  }

  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const user = await db.collection<AuthUserDocument>("authUsers").findOne({ phone }, { projection: { _id: 0 } });
  return { db, user };
}

export async function loginAuthUserSessionWithOtp(input: { otp: string; phone: string }) {
  if (!verifyTestingAuthOtp(input.otp)) {
    throw new Error("Invalid OTP.");
  }

  const { db, user } = await findUserByPhone(input.phone);
  if (!user) {
    throw new Error("No account found for this mobile number.");
  }

  const token = await createSession(db, user.id);
  return { token, user: publicUser(user) };
}

export async function resetAuthUserPasswordWithOtp(input: { otp: string; password: string; phone: string }) {
  if (!verifyTestingAuthOtp(input.otp)) {
    throw new Error("Invalid OTP.");
  }
  const passwordError = validatePasswordStrength(input.password);
  if (passwordError) throw new Error(passwordError);

  const { db, user } = await findUserByPhone(input.phone);
  if (!user) {
    throw new Error("No account found for this mobile number.");
  }

  const password = hashPassword(input.password);
  const updatedAt = new Date().toISOString();
  await db.collection<AuthUserDocument>("authUsers").updateOne(
    { id: user.id },
    {
      $set: {
        passwordHash: password.hash,
        passwordIterations: password.iterations,
        passwordSalt: password.salt,
        updatedAt,
      },
    },
  );
  await db.collection<AuthSessionDocument>("authSessions").deleteMany({ userId: user.id });

  const token = await createSession(db, user.id);
  return { token, user: publicUser({ ...user, updatedAt }) };
}

export async function updateManagedAuthUser(input: {
  accountStatus?: "active" | "suspended";
  password?: string;
  userId: string;
}) {
  if (!isMongoConfigured()) throw new Error("MongoDB is not configured.");
  const passwordError = input.password === undefined ? "" : validatePasswordStrength(input.password);
  if (passwordError) throw new Error(passwordError);

  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const user = await db.collection<AuthUserDocument>("authUsers").findOne({ id: input.userId }, { projection: { _id: 0 } });
  if (!user) throw new Error("User account was not found.");
  if (isBootstrapAdminUser(user)) throw new Error("Owner admin account cannot be changed from user management.");

  const updates: Partial<AuthUserDocument> = { updatedAt: new Date().toISOString() };
  if (input.accountStatus) updates.accountStatus = input.accountStatus;
  if (input.password !== undefined) {
    const password = hashPassword(input.password);
    updates.passwordHash = password.hash;
    updates.passwordIterations = password.iterations;
    updates.passwordSalt = password.salt;
  }
  await db.collection<AuthUserDocument>("authUsers").updateOne({ id: input.userId }, { $set: updates });
  if (input.accountStatus === "suspended" || input.password !== undefined) {
    await db.collection<AuthSessionDocument>("authSessions").deleteMany({ userId: input.userId });
  }
  return publicUser({ ...user, ...updates });
}

export async function revokeManagedAuthUserSessions(userId: string) {
  if (!isMongoConfigured()) throw new Error("MongoDB is not configured.");
  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  const user = await db.collection<AuthUserDocument>("authUsers").findOne({ id: userId }, { projection: { _id: 0 } });
  if (!user) throw new Error("User account was not found.");
  if (isBootstrapAdminUser(user)) throw new Error("Owner admin sessions cannot be revoked from user management.");
  const result = await db.collection<AuthSessionDocument>("authSessions").deleteMany({ userId });
  return result.deletedCount;
}

export async function destroyAuthSession(request: NextRequest) {
  if (!isMongoConfigured()) return;
  const token = tokenFromRequest(request);
  if (!token) return;
  const db = await getMongoDb();
  await ensureAuthIndexes(db);
  await db.collection<AuthSessionDocument>("authSessions").deleteOne({ tokenHash: hashToken(token) });
}
