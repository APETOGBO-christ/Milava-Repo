// Admin access control middleware and utilities
import { createAdminSupabaseClient } from "./admin";
import { userRoleService } from "./user-roles";

export interface AdminAccessCheck {
  hasAccess: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  userId?: string;
  reason?: string;
}

export class AdminAccessService {
  private supabase = createAdminSupabaseClient();

  async checkAdminAccess(userId?: string): Promise<AdminAccessCheck> {
    if (!userId) {
      return {
        hasAccess: false,
        isAdmin: false,
        isModerator: false,
        reason: "User not authenticated",
      };
    }

    try {
      const isAdmin = await userRoleService.isAdmin(userId);
      const isModerator = await userRoleService.isModerator(userId);

      return {
        hasAccess: isAdmin || isModerator,
        isAdmin,
        isModerator,
        userId,
      };
    } catch (error) {
      console.error("Failed to check admin access:", error);
      return {
        hasAccess: false,
        isAdmin: false,
        isModerator: false,
        userId,
        reason: "Failed to verify access",
      };
    }
  }

  async requireAdminAccess(userId?: string): Promise<void> {
    const access = await this.checkAdminAccess(userId);
    if (!access.hasAccess) {
      throw new Error("Admin access required");
    }
  }

  async grantAdminAccess(userId: string): Promise<void> {
    try {
      // Check if already admin
      const isAdmin = await userRoleService.isAdmin(userId);
      if (isAdmin) {
        console.log(`User ${userId} is already an admin`);
        return;
      }

      // Add admin role
      await userRoleService.addRole(userId, "admin");
      console.log(`Granted admin access to user ${userId}`);
    } catch (error) {
      console.error(`Failed to grant admin access to ${userId}:`, error);
      throw error;
    }
  }

  async revokeAdminAccess(userId: string): Promise<void> {
    try {
      await userRoleService.removeRole(userId, "admin");
      console.log(`Revoked admin access from user ${userId}`);
    } catch (error) {
      console.error(`Failed to revoke admin access from ${userId}:`, error);
      throw error;
    }
  }

  async grantModeratorAccess(userId: string): Promise<void> {
    try {
      // Check if already moderator
      const isModerator = await userRoleService.isModerator(userId);
      if (isModerator) {
        console.log(`User ${userId} is already a moderator`);
        return;
      }

      // Add moderator role
      await userRoleService.addRole(userId, "moderator");
      console.log(`Granted moderator access to user ${userId}`);
    } catch (error) {
      console.error(`Failed to grant moderator access to ${userId}:`, error);
      throw error;
    }
  }

  async revokeModeratorAccess(userId: string): Promise<void> {
    try {
      await userRoleService.removeRole(userId, "moderator");
      console.log(`Revoked moderator access from user ${userId}`);
    } catch (error) {
      console.error(`Failed to revoke moderator access from ${userId}:`, error);
      throw error;
    }
  }
}

export const adminAccessService = new AdminAccessService();
