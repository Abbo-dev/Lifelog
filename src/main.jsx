import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./AuthContext.jsx";
import { ToastProvider } from "@heroui/toast";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark">
      {" "}
      {/* Adds dynamic "class" management */}
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
