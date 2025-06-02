import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User, LoginData, RegisterData } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // Create table if it doesn't exist
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "your-session-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(credentials: LoginData): Promise<User | null> {
  try {
    const user = await storage.getUserByUsername(credentials.username);
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login time
    await storage.updateUserLastLogin(user.id);
    
    // Log authentication event
    await storage.createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "users",
      entityId: user.id.toString(),
      newData: { timestamp: new Date().toISOString() }
    });

    return user;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export async function registerUser(userData: RegisterData): Promise<User | null> {
  try {
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Check if email already exists
    if (userData.email) {
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const newUser = await storage.createUser({
      username: userData.username,
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || "employee",
      permissions: [],
      isActive: true,
    });

    // Log registration event
    await storage.createAuditLog({
      userId: newUser.id,
      action: "CREATE",
      entityType: "users",
      entityId: newUser.id.toString(),
      newData: { 
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

    return newUser;
  } catch (error) {
    console.error("Registration error:", error);
    return null;
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export const requirePermission = (permission: string): RequestHandler => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Admins have all permissions
    if (req.user.role === "admin") {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ message: `Permission denied: ${permission} required` });
    }

    next();
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
    interface Session {
      userId?: number;
    }
  }
}