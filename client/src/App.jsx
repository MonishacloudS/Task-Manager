import { useEffect } from "react";
import "./App.css";
import AuthForm from "./components/AuthForm";
import TaskManager from "./components/TaskManager";
import { useAuth } from "./context/AuthContext";
import { useLocalStorage } from "./hooks/useLocalStorage";

function App() {
  const { isAuthenticated, logout, user } = useAuth();
  const [theme, setTheme] = useLocalStorage("theme", "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <main className="app-shell">
      {isAuthenticated ? (
        <TaskManager
          theme={theme}
          toggleTheme={() =>
            setTheme((prev) => (prev === "light" ? "dark" : "light"))
          }
          onLogout={logout}
          userName={user?.name || "User"}
        />
      ) : (
        <AuthForm />
      )}
    </main>
  );
}

export default App;
