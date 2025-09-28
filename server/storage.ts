import { type AdminUser as User, type InsertAdminUser as InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // This is a mock implementation - in reality, we would need to search by email or other field
    // Since AdminUser doesn't have a username field, we'll return undefined
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // This is a mock implementation - in reality, we would need to interact with Supabase
    // For now, we'll just create a mock user with a random ID
    const id = randomUUID();
    // @ts-ignore - This is a mock implementation
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();