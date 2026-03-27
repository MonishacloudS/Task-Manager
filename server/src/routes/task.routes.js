const express = require("express");
const { all, get, run } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const tasks = await all(
      "SELECT id, title, completed, position, created_at, updated_at FROM tasks WHERE user_id = ? ORDER BY position ASC, id ASC",
      [req.user.id],
    );
    res.json(tasks.map((task) => ({ ...task, completed: Boolean(task.completed) })));
  } catch (error) {
    res.status(500).json({ message: "failed to fetch tasks", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    res.status(400).json({ message: "task title is required" });
    return;
  }

  try {
    const maxPosition = await get(
      "SELECT COALESCE(MAX(position), -1) AS maxPosition FROM tasks WHERE user_id = ?",
      [req.user.id],
    );

    const result = await run(
      "INSERT INTO tasks (user_id, title, completed, position) VALUES (?, ?, 0, ?)",
      [req.user.id, title.trim(), (maxPosition?.maxPosition ?? -1) + 1],
    );

    const task = await get(
      "SELECT id, title, completed, position, created_at, updated_at FROM tasks WHERE id = ? AND user_id = ?",
      [result.lastID, req.user.id],
    );
    res.status(201).json({ ...task, completed: Boolean(task.completed) });
  } catch (error) {
    res.status(500).json({ message: "failed to create task", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const taskId = Number(req.params.id);
  const { title, completed } = req.body;

  if (!Number.isInteger(taskId)) {
    res.status(400).json({ message: "invalid task id" });
    return;
  }

  if (typeof title === "string" && !title.trim()) {
    res.status(400).json({ message: "task title cannot be empty" });
    return;
  }

  try {
    const existing = await get(
      "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.user.id],
    );
    if (!existing) {
      res.status(404).json({ message: "task not found" });
      return;
    }

    const fields = [];
    const params = [];

    if (typeof title === "string") {
      fields.push("title = ?");
      params.push(title.trim());
    }
    if (typeof completed === "boolean") {
      fields.push("completed = ?");
      params.push(completed ? 1 : 0);
    }

    if (fields.length === 0) {
      res.status(400).json({ message: "nothing to update" });
      return;
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    await run(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
      [...params, taskId, req.user.id],
    );

    const updated = await get(
      "SELECT id, title, completed, position, created_at, updated_at FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.user.id],
    );
    res.json({ ...updated, completed: Boolean(updated.completed) });
  } catch (error) {
    res.status(500).json({ message: "failed to update task", error: error.message });
  }
});

router.put("/reorder/all", async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ message: "orderedIds must be an array" });
    return;
  }

  try {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await run(
        "UPDATE tasks SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        [index, Number(orderedIds[index]), req.user.id],
      );
    }
    res.json({ message: "tasks reordered" });
  } catch (error) {
    res.status(500).json({ message: "failed to reorder tasks", error: error.message });
  }
});

router.delete("/completed/all", async (req, res) => {
  try {
    const result = await run(
      "DELETE FROM tasks WHERE user_id = ? AND completed = 1",
      [req.user.id],
    );
    res.json({ message: "completed tasks cleared", deletedCount: result.changes || 0 });
  } catch (error) {
    res.status(500).json({ message: "failed to clear completed tasks", error: error.message });
  }
});

router.delete("/completed", async (req, res) => {
  try {
    const result = await run(
      "DELETE FROM tasks WHERE user_id = ? AND completed = 1",
      [req.user.id],
    );
    res.json({ message: "completed tasks cleared", deletedCount: result.changes || 0 });
  } catch (error) {
    res.status(500).json({ message: "failed to clear completed tasks", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId)) {
    res.status(400).json({ message: "invalid task id" });
    return;
  }

  try {
    const result = await run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [
      taskId,
      req.user.id,
    ]);
    if (result.changes === 0) {
      res.status(404).json({ message: "task not found" });
      return;
    }
    res.json({ message: "task deleted" });
  } catch (error) {
    res.status(500).json({ message: "failed to delete task", error: error.message });
  }
});

module.exports = router;
