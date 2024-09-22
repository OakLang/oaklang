import { Loader2 } from "lucide-react";

export default function FullScreenLoader() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
