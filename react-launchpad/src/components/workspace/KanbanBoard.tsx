import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Clock, 
  Calendar, 
  MessageCircle,
  Paperclip,
  Edit3,
  Trash2
} from 'lucide-react';
import { KanbanTask, KanbanTaskStatus, KanbanTaskPriorityLevel, KanbanSubtask } from '../../types';
import { getTasks, updateTask, createTask, deleteTask, getSubtasks, updateSubtask } from '../../apiendpoint';
import { useDroppable } from '@dnd-kit/core';
// Remove import { mockSubtasks } from '../../utils/mockData';

interface KanbanColumnProps {
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  tasks: KanbanTask[];
  onTaskClick: (task: KanbanTask) => void;
  setShowAddTaskModal: React.Dispatch<React.SetStateAction<boolean>>;
  subtasks: KanbanSubtask[];
  setEditSubtask: React.Dispatch<React.SetStateAction<KanbanSubtask | null>>;
}

interface SortableTaskProps {
  task: KanbanTask;
  onClick: () => void;
}

// Utility to prevent drag/click conflict
function useClickGuard() {
  const dragging = React.useRef(false);
  return {
    onPointerDown: () => { dragging.current = false; },
    onPointerMove: () => { dragging.current = true; },
    onClick: (cb: () => void) => (e: React.MouseEvent) => {
      if (!dragging.current) cb();
      dragging.current = false;
    },
  };
}

function usePointerClickGuard(onClick: () => void) {
  const downPos = React.useRef<{x: number, y: number} | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (downPos.current) {
        const dx = Math.abs(e.clientX - downPos.current.x);
        const dy = Math.abs(e.clientY - downPos.current.y);
        if (dx < 5 && dy < 5) {
          onClick();
        }
        downPos.current = null;
      }
    }
  };
}

function SortableTask({ task, onClick }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.Id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Map priority enum to label and badge
  const priorityLabel = task.Priority === KanbanTaskPriorityLevel.Urgent
    ? 'urgent'
    : task.Priority === KanbanTaskPriorityLevel.High
    ? 'high'
    : task.Priority === KanbanTaskPriorityLevel.Medium
    ? 'medium'
    : 'low';
  const badgeVariant = task.Priority === KanbanTaskPriorityLevel.Urgent
    ? 'danger'
    : task.Priority === KanbanTaskPriorityLevel.High
    ? 'danger'
    : task.Priority === KanbanTaskPriorityLevel.Medium
    ? 'warning'
    : 'default';

  const createdBy = task.CreatedByUser?.FirstName + (task.CreatedByUser?.LastName ? ' ' + task.CreatedByUser.LastName : '');
  const assignedTo = task.AssignedToUser?.FirstName + (task.AssignedToUser?.LastName ? ' ' + task.AssignedToUser.LastName : '');

  const clickGuard = usePointerClickGuard(onClick);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-pointer"
    >
      <Card hover padding="sm" className="border border-gray-200">
        <div
          className="space-y-3"
          onPointerDown={clickGuard.onPointerDown}
          onPointerUp={clickGuard.onPointerUp}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{task.Title}</h3>
            <Badge 
              variant={badgeVariant}
              size="sm"
            >
              {priorityLabel}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{task.Description}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex flex-col">
              <span>Created by: <span className="font-semibold text-gray-700">{createdBy}</span></span>
              <span>Assigned to: <span className="font-semibold text-gray-700">{assignedTo}</span></span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {task.EstimatedDeadline ? new Date(task.EstimatedDeadline).toLocaleDateString() : 'No deadline'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SubtaskCard({ subtask, onClick }: { subtask: KanbanSubtask; onClick: (subtask: KanbanSubtask) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `subtask-${subtask.Id}` });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const clickGuard = usePointerClickGuard(() => onClick(subtask));
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-pointer"
    >
      <Card hover padding="sm" className="border-2 border-blue-400 bg-blue-50 shadow-sm">
        <div
          className="space-y-2"
          onPointerDown={clickGuard.onPointerDown}
          onPointerUp={clickGuard.onPointerUp}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-900 text-sm">{subtask.Title}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-200 text-blue-800 font-semibold">Subtask</span>
          </div>
          <div className="text-xs text-blue-700">{subtask.Description}</div>
          <div className="flex items-center text-xs text-blue-500">
            <Calendar className="w-3 h-3 mr-1" />
            {subtask.DueDate ? new Date(subtask.DueDate).toLocaleDateString() : 'No due date'}
          </div>
          <div className="text-xs text-blue-500">Status: {subtask.Status}</div>
          <div className="text-xs text-blue-600 font-semibold">Parent Task ID: {subtask.TaskItemId}</div>
        </div>
      </Card>
    </div>
  );
}

function KanbanColumn({ title, status, tasks, onTaskClick, setShowAddTaskModal, subtasks, setEditSubtask }: KanbanColumnProps) {
  const statusColors = {
    todo: 'bg-gray-100',
    inprogress: 'bg-blue-100',
    done: 'bg-green-100'
  };
  const { setNodeRef } = useDroppable({ id: `column-${status}` });

  // Show all subtasks whose status matches the column, regardless of parent task
  const columnSubtasks = subtasks.filter(st => st.Status === columnToStatus[status]);
  // Combine task and subtask IDs for SortableContext
  const sortableIds = [
    ...columnSubtasks.map(st => `subtask-${st.Id}`),
    ...tasks.map(t => t.Id)
  ];

  return (
    <div className="flex-1 min-w-80">
      <div ref={setNodeRef} className={`rounded-lg p-4 ${statusColors[status]}`}> {/* droppable area */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 capitalize">
            {title} ({tasks.length + columnSubtasks.length})
          </h2>
          <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowAddTaskModal(true)}>
            Add Task
          </Button>
        </div>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-96">
            {/* Render subtask cards for this column */}
            {columnSubtasks.map(subtask => (
              <SubtaskCard key={`subtask-${subtask.Id}`} subtask={subtask} onClick={setEditSubtask} />
            ))}
            {/* Render main task cards */}
            {tasks.map((task) => (
              <SortableTask
                key={task.Id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// Status mapping helpers
const statusToColumn = {
  [KanbanTaskStatus.ToDo]: 'todo',
  [KanbanTaskStatus.InProgress]: 'inprogress',
  [KanbanTaskStatus.Done]: 'done',
};
const columnToStatus = {
  'todo': KanbanTaskStatus.ToDo,
  'inprogress': KanbanTaskStatus.InProgress,
  'done': KanbanTaskStatus.Done,
};

// Priority label and badge mapping for modal
const getPriorityLabel = (priority: KanbanTaskPriorityLevel) => {
  switch (priority) {
    case KanbanTaskPriorityLevel.Urgent:
      return 'urgent';
    case KanbanTaskPriorityLevel.High:
      return 'high';
    case KanbanTaskPriorityLevel.Medium:
      return 'medium';
    default:
      return 'low';
  }
};
const getBadgeVariant = (priority: KanbanTaskPriorityLevel) => {
  switch (priority) {
    case KanbanTaskPriorityLevel.Urgent:
    case KanbanTaskPriorityLevel.High:
      return 'danger';
    case KanbanTaskPriorityLevel.Medium:
      return 'warning';
    default:
      return 'default';
  }
};

// Add Task Modal Component
function AddTaskModal({ isOpen, onClose, onSubmit, loading }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: any) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    estimatedDeadline: '',
    priority: KanbanTaskPriorityLevel.Low,
    createdByUserId: 1,
    assignedToUserId: 1,
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      priority: Number(form.priority),
      createdByUserId: Number(form.createdByUserId),
      assignedToUserId: Number(form.assignedToUserId),
    });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-title">Title</label>
        <input id="add-title" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-description">Description</label>
        <textarea id="add-description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-estimatedDeadline">Estimated Deadline</label>
        <input id="add-estimatedDeadline" name="estimatedDeadline" type="date" value={form.estimatedDeadline} onChange={handleChange} className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-priority">Priority</label>
        <select id="add-priority" name="priority" value={form.priority} onChange={handleChange} className="w-full border p-2 rounded">
          <option value={KanbanTaskPriorityLevel.Low}>Low</option>
          <option value={KanbanTaskPriorityLevel.Medium}>Medium</option>
          <option value={KanbanTaskPriorityLevel.High}>High</option>
          <option value={KanbanTaskPriorityLevel.Urgent}>Urgent</option>
        </select>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-createdByUserId">Created By User ID</label>
        <input id="add-createdByUserId" name="createdByUserId" type="number" value={form.createdByUserId} onChange={handleChange} placeholder="Created By User ID" className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-assignedToUserId">Assigned To User ID</label>
        <input id="add-assignedToUserId" name="assignedToUserId" type="number" value={form.assignedToUserId} onChange={handleChange} placeholder="Assigned To User ID" className="w-full border p-2 rounded" required />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Task Modal Component
function EditTaskModal({ isOpen, onClose, onSubmit, loading, task }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, form: any) => void;
  loading: boolean;
  task: KanbanTask | null;
}) {
  const [form, setForm] = useState<any>(task ? {
    title: task.Title,
    description: task.Description || '',
    estimatedDeadline: task.EstimatedDeadline ? task.EstimatedDeadline.split('T')[0] : '',
    priority: task.Priority,
    createdByUserId: task.CreatedByUserId,
    assignedToUserId: task.AssignedToUserId,
    status: task.Status,
  } : {});
  useEffect(() => {
    if (task) {
      setForm({
        title: task.Title,
        description: task.Description || '',
        estimatedDeadline: task.EstimatedDeadline ? task.EstimatedDeadline.split('T')[0] : '',
        priority: task.Priority,
        createdByUserId: task.CreatedByUserId,
        assignedToUserId: task.AssignedToUserId,
        status: task.Status,
      });
    }
  }, [task]);
  if (!task) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(task.Id, {
      ...form,
      priority: Number(form.priority),
      createdByUserId: Number(form.createdByUserId),
      assignedToUserId: Number(form.assignedToUserId),
      status: Number(form.status),
    });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-title">Title</label>
        <input id="edit-title" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-description">Description</label>
        <textarea id="edit-description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-estimatedDeadline">Estimated Deadline</label>
        <input id="edit-estimatedDeadline" name="estimatedDeadline" type="date" value={form.estimatedDeadline} onChange={handleChange} className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-priority">Priority</label>
        <select id="edit-priority" name="priority" value={form.priority} onChange={handleChange} className="w-full border p-2 rounded">
          <option value={KanbanTaskPriorityLevel.Low}>Low</option>
          <option value={KanbanTaskPriorityLevel.Medium}>Medium</option>
          <option value={KanbanTaskPriorityLevel.High}>High</option>
          <option value={KanbanTaskPriorityLevel.Urgent}>Urgent</option>
        </select>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-createdByUserId">Created By User ID</label>
        <input id="edit-createdByUserId" name="createdByUserId" type="number" value={form.createdByUserId} onChange={handleChange} placeholder="Created By User ID" className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-assignedToUserId">Assigned To User ID</label>
        <input id="edit-assignedToUserId" name="assignedToUserId" type="number" value={form.assignedToUserId} onChange={handleChange} placeholder="Assigned To User ID" className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-status">Status</label>
        <select id="edit-status" name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
          <option value={KanbanTaskStatus.ToDo}>To Do</option>
          <option value={KanbanTaskStatus.InProgress}>In Progress</option>
          <option value={KanbanTaskStatus.Done}>Done</option>
        </select>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Subtask Edit Modal
function EditSubtaskModal({ isOpen, onClose, onSubmit, loading, subtask }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, form: any) => void;
  loading: boolean;
  subtask: KanbanSubtask | null;
}) {
  const [form, setForm] = useState<any>(subtask ? {
    title: subtask.Title,
    description: subtask.Description || '',
    dueDate: subtask.DueDate ? subtask.DueDate.split('T')[0] : '',
    status: subtask.Status,
  } : {});
  useEffect(() => {
    if (subtask) {
      setForm({
        title: subtask.Title,
        description: subtask.Description || '',
        dueDate: subtask.DueDate ? subtask.DueDate.split('T')[0] : '',
        status: subtask.Status,
      });
    }
  }, [subtask]);
  if (!subtask) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(subtask.Id, {
      ...form,
      status: Number(form.status),
    });
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Subtask" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-title">Title</label>
        <input id="edit-subtask-title" name="title" value={form.title} onChange={handleChange} placeholder="Title" className="w-full border p-2 rounded" required />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-description">Description</label>
        <textarea id="edit-subtask-description" name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-dueDate">Due Date</label>
        <input id="edit-subtask-dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className="w-full border p-2 rounded" />
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-subtask-status">Status</label>
        <select id="edit-subtask-status" name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
          <option value={KanbanTaskStatus.ToDo}>To Do</option>
          <option value={KanbanTaskStatus.InProgress}>In Progress</option>
          <option value={KanbanTaskStatus.Done}>Done</option>
        </select>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<KanbanSubtask[]>([]);
  const [selectedSubtask, setSelectedSubtask] = useState<KanbanSubtask | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const data = await getTasks();
        setTasks(data);
        const subtaskData = await getSubtasks();
        setSubtasks(subtaskData);
      } catch (e) {
        // handle error (could show toast)
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    // Handle subtasks
    if (typeof active.id === 'string' && active.id.startsWith('subtask-')) {
      const subtaskId = Number(active.id.replace('subtask-', ''));
      const activeSubtask = subtasks.find(st => st.Id === subtaskId);
      if (!activeSubtask) return;
      let newStatus = activeSubtask.Status;
      // If dropped on a column, set status based on column
      if (over.id && typeof over.id === 'string' && over.id.startsWith('column-')) {
        const col = over.id.replace('column-', '');
        if (col === 'todo') newStatus = KanbanTaskStatus.ToDo;
        else if (col === 'inprogress') newStatus = KanbanTaskStatus.InProgress;
        else if (col === 'done') newStatus = KanbanTaskStatus.Done;
      } else {
        // If dropped on another subtask, use that subtask's status
        if (typeof over.id === 'string' && over.id.startsWith('subtask-')) {
          const overSubtaskId = Number(over.id.replace('subtask-', ''));
          const overSubtask = subtasks.find(st => st.Id === overSubtaskId);
          if (overSubtask && overSubtask.Status !== activeSubtask.Status) {
            newStatus = overSubtask.Status;
          }
        }
      }
      if (newStatus !== activeSubtask.Status && newStatus !== undefined) {
        try {
          setFormLoading(true);
          await updateSubtask(activeSubtask.Id, { status: newStatus });
          const subtaskData = await getSubtasks();
          setSubtasks(subtaskData);
        } catch (e) {
          // Optionally show error toast
        } finally {
          setFormLoading(false);
        }
      }
      return;
    }
    // Handle tasks (existing logic)
    const activeTask = tasks.find(t => t.Id === active.id);
    if (!activeTask) return;
    let newStatus = activeTask.Status;
    // If dropped on a column, set status based on column
    if (over.id && typeof over.id === 'string' && over.id.startsWith('column-')) {
      const col = over.id.replace('column-', '');
      if (col === 'todo') newStatus = KanbanTaskStatus.ToDo;
      else if (col === 'inprogress') newStatus = KanbanTaskStatus.InProgress;
      else if (col === 'done') newStatus = KanbanTaskStatus.Done;
    } else {
      // If dropped on a task, use that task's status
      const overTask = tasks.find(t => t.Id === over.id);
      if (overTask && overTask.Status !== activeTask.Status) {
        newStatus = overTask.Status;
      }
    }
    if (newStatus !== activeTask.Status && newStatus !== undefined) {
      try {
        setFormLoading(true);
        await updateTask(activeTask.Id, { status: newStatus });
        const data = await getTasks();
        setTasks(data);
      } catch (e) {
        // Optionally show error toast
      } finally {
        setFormLoading(false);
      }
    }
  };

  const handleTaskClick = (task: KanbanTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleAddTask = async (form: {
    title: string;
    description: string;
    estimatedDeadline: string;
    priority: KanbanTaskPriorityLevel;
    createdByUserId: number;
    assignedToUserId: number;
  }) => {
    setFormLoading(true);
    try {
      const newTask = await createTask(form);
      setTasks(tasks => [...tasks, newTask]);
      setShowAddTaskModal(false);
    } catch (e) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTask = async (id: number, update: Partial<{
    title: string;
    description: string;
    estimatedDeadline: string;
    priority: KanbanTaskPriorityLevel;
    createdByUserId: number;
    assignedToUserId: number;
    status: KanbanTaskStatus;
  }>) => {
    setFormLoading(true);
    try {
      await updateTask(id, update);
      const data = await getTasks();
      setTasks(data);
      setEditTask(null);
      setShowTaskModal(false);
    } catch (e) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    setDeleteLoading(true);
    try {
      await deleteTask(id);
      setTasks(tasks => tasks.filter(task => task.Id !== id));
      setShowTaskModal(false);
    } catch (e) {
      // handle error
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSubtask = async (id: number, update: Partial<{
    title: string;
    description: string;
    dueDate: string;
    status: KanbanTaskStatus;
  }>) => {
    setFormLoading(true);
    try {
      await updateSubtask(id, update);
      const subtaskData = await getSubtasks();
      setSubtasks(subtaskData);
      setSelectedSubtask(null);
    } catch (e) {
      // handle error
    } finally {
      setFormLoading(false);
    }
  };

  const todoTasks = tasks.filter(t => t.Status === KanbanTaskStatus.ToDo)
    .sort((a, b) => b.Priority - a.Priority);
  const inProgressTasks = tasks.filter(t => t.Status === KanbanTaskStatus.InProgress)
    .sort((a, b) => b.Priority - a.Priority);
  const doneTasks = tasks.filter(t => t.Status === KanbanTaskStatus.Done)
    .sort((a, b) => b.Priority - a.Priority);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-6 overflow-x-auto pb-6">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={todoTasks}
            onTaskClick={handleTaskClick}
            setShowAddTaskModal={setShowAddTaskModal}
            subtasks={subtasks}
            setEditSubtask={setSelectedSubtask}
          />
          <KanbanColumn
            title="In Progress"
            status="inprogress"
            tasks={inProgressTasks}
            onTaskClick={handleTaskClick}
            setShowAddTaskModal={setShowAddTaskModal}
            subtasks={subtasks}
            setEditSubtask={setSelectedSubtask}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={doneTasks}
            onTaskClick={handleTaskClick}
            setShowAddTaskModal={setShowAddTaskModal}
            subtasks={subtasks}
            setEditSubtask={setSelectedSubtask}
          />
        </div>
      </DndContext>

      {/* Task Detail Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedTask.Title}
                </h2>
                <p className="text-gray-600">{selectedTask.Description}</p>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button variant="outline" size="sm" icon={Edit3} onClick={() => {
                  setEditTask(selectedTask);
                  setShowTaskModal(false);
                }}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" icon={Trash2} onClick={() => handleDeleteTask(selectedTask.Id)} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Created by</label>
                <span className="text-sm text-gray-900">{selectedTask.CreatedByUser?.FirstName}{selectedTask.CreatedByUser?.LastName ? ' ' + selectedTask.CreatedByUser.LastName : ''}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned to</label>
                <span className="text-sm text-gray-900">{selectedTask.AssignedToUser?.FirstName}{selectedTask.AssignedToUser?.LastName ? ' ' + selectedTask.AssignedToUser.LastName : ''}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <Badge 
                  variant={getBadgeVariant(selectedTask.Priority)}
                >
                  {getPriorityLabel(selectedTask.Priority)}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2" />
                  {selectedTask.EstimatedDeadline ? new Date(selectedTask.EstimatedDeadline).toLocaleDateString() : 'No deadline'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments & Activity
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  No comments yet. Be the first to add one!
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No attachments</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
        loading={formLoading}
      />
      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEditTask}
        loading={formLoading}
        task={editTask}
      />
      {/* Edit Subtask Modal */}
      <EditSubtaskModal
        isOpen={!!selectedSubtask}
        onClose={() => setSelectedSubtask(null)}
        onSubmit={handleEditSubtask}
        loading={formLoading}
        subtask={selectedSubtask}
      />
    </>
  );
}