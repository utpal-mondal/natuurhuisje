// Role checking and permission utilities

import { createClient } from '@/utils/supabase/client';
import { RoleName, RolePermissions, Permission } from '@/types/roles';

// Re-export RoleName for convenience
export type { RoleName } from '@/types/roles';

/**
 * Get the current user's role from the database
 */
export async function getUserRole(userId: string): Promise<RoleName | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user role:', {
        error,
        userId,
        errorMessage: error?.message,
        errorDetails: error?.details,
        noData: !data
      });
      return null;
    }

    return (data as any).role_name as RoleName;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleName: RoleName): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole === roleName;
}

/**
 * Check if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'admin');
}

/**
 * Check if user is a landlord
 */
export async function isLandlord(userId: string): Promise<boolean> {
  return hasRole(userId, 'landlord');
}

/**
 * Check if user is a regular user
 */
export async function isUser(userId: string): Promise<boolean> {
  return hasRole(userId, 'user');
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId);
  
  if (!role) return false;
  
  const permissions = RolePermissions[role];
  return permissions[permission] === true;
}

/**
 * Check if user can edit a specific house
 */
export async function canEditHouse(userId: string, houseId: number): Promise<boolean> {
  const supabase = createClient();
  
  // Check if user is admin
  if (await isAdmin(userId)) {
    return true;
  }
  
  // Check if user is landlord and owns the house
  if (await isLandlord(userId)) {
    const { data, error } = await supabase
      .from('houses')
      .select('host_id')
      .eq('id', houseId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return (data as any).host_id === userId;
  }
  
  return false;
}

/**
 * Check if user can delete a specific house
 */
export async function canDeleteHouse(userId: string, houseId: number): Promise<boolean> {
  return canEditHouse(userId, houseId);
}

/**
 * Get all houses for a user based on their role
 */
export async function getUserHouses(userId: string) {
  const supabase = createClient();
  const role = await getUserRole(userId);
  
  if (role === 'admin') {
    // Admin can see all houses
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  } else if (role === 'landlord') {
    // Landlord can only see their own houses
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
  
  // Regular users can't see houses in admin panel
  return { data: [], error: null };
}

/**
 * Get user profile with role information
 */
export async function getUserProfile(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', userId)
    .single();
  
  return { data, error };
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  adminUserId: string,
  targetUserId: string,
  newRole: RoleName
): Promise<{ success: boolean; error?: string }> {
  // Check if the requesting user is an admin
  if (!(await isAdmin(adminUserId))) {
    return { success: false, error: 'Only admins can update user roles' };
  }
  
  const supabase = createClient();
  
  const { error } = await (supabase.from('users') as any)
    .update({ role: newRole })
    .eq('auth_user_id', targetUserId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Get all available roles
 */
export async function getAllRoles() {
  // Since roles are defined in the enum, return them directly
  const roles = [
    { id: 1, name: 'user', description: 'Regular user' },
    { id: 2, name: 'landlord', description: 'Property owner' },
    { id: 3, name: 'admin', description: 'Administrator' }
  ];
  
  return { data: roles, error: null };
}
