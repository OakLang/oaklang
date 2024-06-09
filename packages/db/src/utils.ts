import crypto from "crypto";
import KSUID from "ksuid";

export const prefixedKSUID = (prefix: string) => {
  const date = Date.now();
  const payload = crypto.randomBytes(16);
  const ksuid = KSUID.fromParts(date, payload);
  return `${prefix}_${ksuid.string}`;
};
