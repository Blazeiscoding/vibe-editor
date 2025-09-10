/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="cursor-pointer"
      onClick={() => {
        if (theme === "light") {
          setTheme("dark");
        } else if (theme === "dark") {
          setTheme("system");
        } else {
          setTheme("light");
        }
      }}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 text-black dark:text-white" />
      ) : theme === "dark" ? (
        <Sun className="h-5 w-5 text-white" />
      ) : (
        <SunMoon className="h-5 w-5 text-black dark:text-white" />
      )}
    </div>
  );
}
