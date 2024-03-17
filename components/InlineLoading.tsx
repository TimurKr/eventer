"use client";

import { useEffect, useState } from "react";

export default function InlineLoading({ className }: { className?: string }) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots % 3) + 1);
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <p
      className={`text-xs text-gray-500 font-mono whitespace-pre ${className}`}
    >
      Loading
      {".".repeat(dots)}
      {" ".repeat(3 - dots)}
    </p>
  );
}
