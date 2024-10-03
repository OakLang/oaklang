import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createHydrationHelpers } from "@trpc/react-query/rsc";

import type { appRouter } from "@acme/api";
import { createCaller, createTRPCContext } from "@acme/api";
import { auth } from "@acme/auth";

import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    session: await auth(),
    headers: heads,
  });
});

const caller = createCaller(createContext);

export const { trpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient,
);
