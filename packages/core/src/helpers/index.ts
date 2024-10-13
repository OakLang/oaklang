export const hasPowerUserAccess = (role?: string | null | undefined) => {
  return role === "power" || role === "admin";
};

export const hasAdminUserAccess = (role: string) => {
  return role === "admin";
};
