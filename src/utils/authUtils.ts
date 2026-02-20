import { Profile } from "../types/profile";

export type Role = Profile['role'];

/**
 * Higher rank = Lower privilege (0 or 1 is highest)
 */
export const getRoleRank = (role?: Role): number => {
    const r = role?.toLowerCase();
    if (r === 'super-admin' || r === 'super admin') return 1;
    if (r === 'admin' || r === 'manager') return 2;
    if (r === 'support') return 3;
    if (r === 'forwarder') return 4;
    if (r === 'driver') return 5;
    if (r === 'client') return 6;
    if (r === 'supplier') return 7;
    return 10; // Default low privilege
};

export const isAdmin = (role?: Role): boolean => {
    return role === 'admin' || role === 'super-admin';
};

export const isStaff = (role?: Role, profile?: Profile | null): boolean => {
    // A staff member is anyone with a forwarder_id linking to a master account,
    // OR someone in the administrative/support family.
    if (profile?.forwarder_id) return true;
    return ['admin', 'super-admin', 'support', 'manager'].includes(role || '');
};

export const isForwarder = (role?: Role): boolean => {
    return role === 'forwarder';
};

export const isClient = (role?: Role): boolean => {
    return role === 'client';
};

export const isDriver = (role?: Role): boolean => {
    return role === 'driver';
};

/**
 * Checks if current user can manage a target user based on rank
 */
export const canManageRole = (currentRole: Role, targetRole: Role): boolean => {
    const currentRank = getRoleRank(currentRole);
    const targetRank = getRoleRank(targetRole);

    // Super Admin can manage anyone
    if (currentRank === 1) return true;

    // Higher rank (lower number) can manage lower rank (higher number)
    return currentRank < targetRank;
};

/**
 * Group roles into logical families
 */
export const ROLE_FAMILIES = {
    ADMIN: ['admin', 'super-admin', 'support', 'manager'] as Role[],
    FORWARDER: ['forwarder', 'driver'] as Role[],
    CLIENT: ['client'] as Role[],
};

export const isInFamily = (role: Role, family: keyof typeof ROLE_FAMILIES): boolean => {
    return ROLE_FAMILIES[family].includes(role);
};
