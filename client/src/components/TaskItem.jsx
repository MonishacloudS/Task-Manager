import { memo, useState } from "react";

const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  isRemoving = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  const onSave = async () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle || nextTitle === task.title) {
      setDraftTitle(task.title);
      setIsEditing(false);
      return;
    }
    await onEdit(task.id, nextTitle);
    setIsEditing(false);
  };

  const onCancel = () => {
    setDraftTitle(task.title);
    setIsEditing(false);
  };

  return (
    <div className={`task-item ${task.completed ? "done" : ""}`}>
      <label>
        <input
          type="checkbox"
          checked={task.completed}
          disabled={isRemoving || isEditing}
          onChange={() => onToggle(task)}
        />
        {isEditing ? (
          <input
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className="edit-input"
            autoFocus
          />
        ) : (
          <span>{task.title}</span>
        )}
      </label>
      <div className="task-actions">
        {isEditing ? (
          <>
            <button type="button" onClick={onSave} disabled={isRemoving}>
              Save
            </button>
            <button type="button" className="ghost" onClick={onCancel} disabled={isRemoving}>
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ghost"
            onClick={() => setIsEditing(true)}
            disabled={isRemoving}
          >
            Edit
          </button>
        )}
        <button
          type="button"
          className="danger"
          disabled={isRemoving || isEditing}
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
});

export default TaskItem;
