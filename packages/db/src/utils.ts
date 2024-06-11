import { createId } from "@paralleldrive/cuid2";

export const createPrefixedId = (prefix: string) => {
  const cuid = createId();
  return `${prefix}_${cuid}`;
};
