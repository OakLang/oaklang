import { json2csv } from "json-2-csv";

export const hasPowerUserAccess = (role?: string | null | undefined) => {
  return role === "power" || role === "admin";
};

export const hasAdminUserAccess = (role: string) => {
  return role === "admin";
};

export const convertToCSV = (data: object[]) => {
  return json2csv(data, {
    parseValue(fieldValue, defaultParser) {
      if (fieldValue instanceof Date) {
        return fieldValue.toISOString();
      }
      return defaultParser(fieldValue);
    },
  });
};
