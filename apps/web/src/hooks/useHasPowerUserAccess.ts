import { useMemo } from "react";
import { useSession } from "next-auth/react";

import { hasPowerUserAccess } from "@acme/core/helpers";

export const useHasPowerUserAccess = () => {
  const { data: session } = useSession();
  return useMemo(
    () => hasPowerUserAccess(session?.user.role),
    [session?.user.role],
  );
};
