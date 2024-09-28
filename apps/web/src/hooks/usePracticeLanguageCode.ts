import { useParams } from "next/navigation";

export const usePracticeLanguageCode = () => {
  const { practiceLanguage } = useParams();
  if (typeof practiceLanguage !== "string") {
    throw new Error("practiceLanguage not found in params");
  }
  return practiceLanguage;
};
