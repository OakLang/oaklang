import crypto from "crypto";
import ksuid from "ksuid";

export const createPrefixedId = (prefix: string) => {
  const id = ksuid.fromParts(Date.now(), crypto.randomBytes(16));
  return `${prefix}_${id.string}`;
};
