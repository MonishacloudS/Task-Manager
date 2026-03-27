import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const cacheKey = user ? `tasks-cache-${user.id}` : "tasks-cache-guest";
  const [tasks, setTasks] = useLocalStorage(cacheKey, []);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (title) => {
    const response = await api.post("/tasks", { title });
    setTasks((prev) => [...prev, response.data]);
    return response.data;
  }, []);

  const updateTask = useCallback(async (taskId, patch) => {
    const response = await api.put(`/tasks/${taskId}`, patch);
    setTasks((prev) => prev.map((task) => (task.id === taskId ? response.data : task)));
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const clearCompleted = useCallback(async () => {
    const completedTaskIds = tasks
      .filter((task) => task.completed)
      .map((task) => task.id);

    if (completedTaskIds.length === 0) {
      return;
    }

    try {
      await api.delete("/tasks/completed/all");
    } catch (error) {
      try {
        if (error.response?.status === 404) {
          // Backward-compatible fallback if server is on an older route build.
          await api.delete("/tasks/completed");
        } else {
          throw error;
        }
      } catch {
        // Final fallback for very old servers: delete completed tasks one-by-one.
        await Promise.all(
          completedTaskIds.map((taskId) => api.delete(`/tasks/${taskId}`)),
        );
      }
    }
    setTasks((prev) => prev.filter((task) => !task.completed));
  }, [tasks]);

  const reorderTasks = useCallback(async (nextTasks) => {
    setTasks(nextTasks);
    await api.put("/tasks/reorder/all", { orderedIds: nextTasks.map((task) => task.id) });
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      loading,
      fetchTasks,
      addTask,
      updateTask,
      deleteTask,
      clearCompleted,
      reorderTasks,
    }),
    [addTask, clearCompleted, deleteTask, fetchTasks, loading, reorderTasks, tasks, updateTask],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used inside TaskProvider");
  }
  return context;
};
