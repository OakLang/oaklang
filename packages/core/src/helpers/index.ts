export const hasPowerUserAccess = (role: string) => {
  return role === "power" || role === "admin";
};

export const hasAdminUserAccess = (role: string) => {
  return role === "admin";
};
