import { Loader2 } from "lucide-react"; // або будь-яка svg/gif
import React from "react";

export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
      <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
    </div>
  );
}
