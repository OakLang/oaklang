import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Session } from "@acme/auth";
import type { InterlinearLine } from "@acme/core/validators";
import type { DB } from "@acme/db/client";
import type { UserSettings } from "@acme/db/schema";
import { interlinearLine } from "@acme/core/validators";
import { eq } from "@acme/db";
import {
  getDefaultInterlinearLines,
  trainingSessions,
  userSettings,
} from "@acme/db/schema";

export const getTrainingSessionOrThrow = async (
  trainingSessionId: string,
  db: DB,
  session: Session,
) => {
  const [trainingSession] = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, trainingSessionId));
  if (!trainingSession || trainingSession.userId !== session.user.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Training Session not found!",
    });
  }
  return trainingSession;
};

export const getUserSettings = async (userId: string, db: DB) => {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  if (!settings) {
    const [newSettings] = await db
      .insert(userSettings)
      .values({ userId })
      .returning();
    if (!newSettings) {
      throw new Error("Failed to create user settings");
    }
    return newSettings;
  }
  return settings;
};

export const getInterlinearLines = async (
  userId: string,
  db: DB,
  settings?: UserSettings,
) => {
  if (!settings) {
    settings = await getUserSettings(userId, db);
  }
  try {
    const interlinearLines = await z
      .array(interlinearLine)
      .min(1)
      .parseAsync(settings.interlinearLines);
    return interlinearLines;
  } catch (error) {
    const lines = (userSettings.interlinearLines.defaultFn?.() ??
      getDefaultInterlinearLines()) as unknown as InterlinearLine[];
    await db.update(userSettings).set({
      interlinearLines: lines,
    });
    return lines;
  }
};
