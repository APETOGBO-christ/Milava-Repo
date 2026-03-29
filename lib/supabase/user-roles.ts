// User roles and access control
import { createAdminSupabaseClient } from "./admin";

export type UserRole = "user" | "creator" | "company" | "admin" | "moderator";

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export class UserRoleService {
  private supabase = createAdminSupabaseClient();

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await this.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error && error.code !== "PGRST116") {
      console.error("Failed to fetch user roles:", error);
      return [];
    }

    return (data || []).map((r) => r.role);
  }

  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Failed to check role:", error);
      return false;
    }

    return !!data;
  }

  async isAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, "admin");
  }

  async isModerator(userId: string): Promise<boolean> {
    return this.hasRole(userId, "moderator");
  }

  async addRole(userId: string, role: UserRole): Promise<UserRoleRecord> {
    const { data, error } = await this.supabase
      .from("user_roles")
      .insert([{ user_id: userId, role }])
      .select()
      .single();

    if (error) throw new Error(`Failed to add role: ${error.message}`);
    return data;
  }

  async removeRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw new Error(`Failed to remove role: ${error.message}`);
  }

  async setUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    // First, delete all existing roles
    const { error: deleteError } = await this.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError)
      throw new Error(`Failed to clear roles: ${deleteError.message}`);

    // Then insert new roles
    if (roles.length > 0) {
      const { error: insertError } = await this.supabase
        .from("user_roles")
        .insert(roles.map((role) => ({ user_id: userId, role })));

      if (insertError)
        throw new Error(`Failed to set roles: ${insertError.message}`);
    }
  }
}

export const userRoleService = new UserRoleService();
