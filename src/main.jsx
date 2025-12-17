import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "@heroui/toast";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <HeroUIProvider>
        <AuthProvider>
          <ToastProvider />
          <main className="text-foreground bg-transparent min-h-screen">
            <App />
          </main>
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  </StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("Service worker registration failed", error));
  });
}
