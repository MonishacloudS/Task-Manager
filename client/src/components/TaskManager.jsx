import { useCallback, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useTasks } from "../context/TaskContext";
import TaskItem from "./TaskItem";

const ENTER_ANIMATION_MS = 320;
const EXIT_ANIMATION_MS = 260;

const TaskManager = ({ theme, toggleTheme, onLogout, userName }) => {
  const {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    clearCompleted,
    reorderTasks,
  } = useTasks();
  const [taskTitle, setTaskTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [enteringTaskIds, setEnteringTaskIds] = useState([]);
  const [removingTaskIds, setRemovingTaskIds] = useState([]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }
    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }
    return tasks;
  }, [filter, tasks]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  const onAddTask = useCallback(
    async (event) => {
      event.preventDefault();
      if (!taskTitle.trim()) {
        setError("Task cannot be empty");
        return;
      }
      setError("");
      const createdTask = await addTask(taskTitle.trim());
      setEnteringTaskIds((prev) => [...prev, createdTask.id]);
      window.setTimeout(() => {
        setEnteringTaskIds((prev) => prev.filter((taskId) => taskId !== createdTask.id));
      }, ENTER_ANIMATION_MS);
      setTaskTitle("");
    },
    [addTask, taskTitle],
  );

  const onToggleTask = useCallback(
    async (task) => {
      await updateTask(task.id, { completed: !task.completed });
    },
    [updateTask],
  );

  const onDeleteTask = useCallback(
    async (id) => {
      if (removingTaskIds.includes(id)) {
        return;
      }
      setRemovingTaskIds((prev) => [...prev, id]);
      await new Promise((resolve) => {
        window.setTimeout(resolve, EXIT_ANIMATION_MS);
      });
      await deleteTask(id);
      setRemovingTaskIds((prev) => prev.filter((taskId) => taskId !== id));
    },
    [deleteTask, removingTaskIds],
  );

  const onEditTask = useCallback(
    async (id, title) => {
      if (!title.trim()) {
        setError("Task cannot be empty");
        return;
      }
      setError("");
      await updateTask(id, { title: title.trim() });
    },
    [updateTask],
  );

  const onClearCompleted = useCallback(async () => {
    const completedIds = tasks.filter((task) => task.completed).map((task) => task.id);
    if (completedIds.length === 0) {
      return;
    }
    setRemovingTaskIds((prev) => [...new Set([...prev, ...completedIds])]);
    await new Promise((resolve) => {
      window.setTimeout(resolve, EXIT_ANIMATION_MS);
    });
    await clearCompleted();
    setRemovingTaskIds((prev) => prev.filter((id) => !completedIds.includes(id)));
  }, [clearCompleted, tasks]);

  const onDragEnd = useCallback(
    async (result) => {
      if (!result.destination) {
        return;
      }

      const nextTasks = [...filteredTasks];
      const [moved] = nextTasks.splice(result.source.index, 1);
      nextTasks.splice(result.destination.index, 0, moved);

      const reordered = filter === "all"
        ? nextTasks
        : [
            ...nextTasks,
            ...tasks.filter((task) => !nextTasks.some((next) => next.id === task.id)),
          ];

      await reorderTasks(reordered);
    },
    [filter, filteredTasks, reorderTasks, tasks],
  );

  return (
    <div className="task-layout">
      <header>
        <h1>Advanced Task Manager</h1>
        <div className="header-actions">
          <span>Hello, {userName}</span>
          <button type="button" onClick={toggleTheme}>
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </button>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <form className="task-form" onSubmit={onAddTask}>
        <input
          type="text"
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          placeholder="Add a task..."
        />
        <button type="submit">Add</button>
      </form>
      <div className="items-left-badge">
        {taskStats.pending} {taskStats.pending === 1 ? "item" : "items"} left
      </div>
      {error && <p className="error">{error}</p>}

      <div className="filters">
        {["all", "completed", "pending"].map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="task-meta">
        <span>Total: {taskStats.total}</span>
        <span>Completed: {taskStats.completed}</span>
        <span>Pending: {taskStats.pending}</span>
        <button
          type="button"
          className="danger"
          onClick={onClearCompleted}
          disabled={taskStats.completed === 0}
        >
          Clear Completed
        </button>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="task-list">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {filteredTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`task-animate ${
                          enteringTaskIds.includes(task.id) ? "entering" : ""
                        } ${removingTaskIds.includes(task.id) ? "removing" : ""}`}
                      >
                        <TaskItem
                          task={task}
                          onToggle={onToggleTask}
                          onDelete={onDeleteTask}
                          onEdit={onEditTask}
                          isRemoving={removingTaskIds.includes(task.id)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default TaskManager;
