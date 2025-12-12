"use client";

import { useEffect, useState } from "react";

export function SkipLink() {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    // Ensure main content has the correct id
    const main = document.querySelector("main");
    if (main && !main.id) {
      main.id = "main-content";
    }
  }, []);

  return (
    <a
      href="#main-content"
      className={`
        fixed top-0 left-0 z-[9999] 
        px-4 py-2 
        bg-primary text-primary-foreground 
        font-medium text-sm
        transform transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${focused ? "translate-y-0" : "-translate-y-full"}
      `}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}
