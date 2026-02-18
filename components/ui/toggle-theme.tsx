"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, SunMoon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  if (!theme) {
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
