import { useParams } from "next/navigation";

export const useTrainingSessionId = () => {
  const { trainingSessionId } = useParams();
  if (typeof trainingSessionId !== "string") {
    throw new Error("trainingSessionId not found in params");
  }
  return trainingSessionId;
};
