// FleetFlow Role Definitions & Helpers

export const ROLES = {
  FLEET_MANAGER: 1,
  DRIVER: 2,
  SAFETY_OFFICER: 3,
  FINANCIAL_ANALYST: 4,
  SYSTEM_ADMINISTRATOR: 5,
};

export const ROLE_NAMES = {
  [ROLES.FLEET_MANAGER]: "Fleet Manager",
  [ROLES.DRIVER]: "Driver",
  [ROLES.SAFETY_OFFICER]: "Safety Officer",
  [ROLES.FINANCIAL_ANALYST]: "Financial Analyst",
  [ROLES.SYSTEM_ADMINISTRATOR]: "System Administrator",
};

/**
 * Returns user friendly role name based on numeric role_id
 */
export function getRoleName(roleId) {
  return ROLE_NAMES[roleId] || `Role (${roleId})`;
}

/**
 * Checks if a user has one of the allowed role IDs
 */
export function hasAnyRole(userRoleId, allowedRoles = []) {
  if (!userRoleId) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRoleId);
}

/**
 * Navigation items permitted by role
 */
export const NAV_PERMISSIONS = {
  dashboard: [1, 2, 3, 4, 5],
  vehicles: [1, 3, 4, 5],
  drivers: [1, 3, 4, 5],
  trips: [1, 2, 4, 5],
  maintenance: [1, 3, 5],
  fuel: [1, 4, 5],
  expenses: [1, 4, 5],
  documents: [1, 3, 4, 5],
  analytics: [1, 4, 5],
  reports: [1, 3, 4, 5],
  users: [5],
  roles: [5],
  audit: [5],
};
