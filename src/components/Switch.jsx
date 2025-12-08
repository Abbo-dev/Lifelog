import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Moon from "./Moon";
import Sun from "./Sun";

function SwitchTheme() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkMode = theme === "dark";

  const handleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <button
      onClick={handleTheme}
      className="w-8 h-7 rounded-md bg-transparent " // Use `onChange` instead of `onClick`
    >
      <div className="flex items-center justify-center">
        {isDarkMode ? <Sun /> : <Moon />}
      </div>
    </button>
  );
}

export default SwitchTheme;
