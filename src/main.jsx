import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "./theme.css";
import "./components.css";
import "./pages.css";
import App from "./App";
import { AuthProvider, ToastProvider } from "./auth";

// Ivory (light) is the default look; the switch in the top bar saves a dark preference.
let theme = "light";
try {
  theme = localStorage.getItem("aea-theme") === "dark" ? "dark" : "light";
} catch {
  // storage may be blocked (private mode); stay on the light theme
}
document.documentElement.dataset.theme = theme;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
