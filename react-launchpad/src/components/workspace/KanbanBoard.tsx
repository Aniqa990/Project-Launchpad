import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { 
  Plus, 
  Clock, 
  Calendar, 
  MessageCircle,
  Paperclip,
  Edit3,
  Trash2,
  CheckCircle,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { KanbanTask, KanbanTaskStatus, KanbanTaskPriorityLevel, KanbanSubtask } from '../../types';
import { getTasks, updateTask, createTask, deleteTask, getSubtasks, updateSubtask } from '../../apiendpoints';
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
    ? 'Critical'
    : task.Priority === KanbanTaskPriorityLevel.High
    ? 'High'
    : task.Priority === KanbanTaskPriorityLevel.Medium
    ? 'Medium'
    : 'Low';
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createdBy = task.CreatedByUser?.FirstName + (task.CreatedByUser?.LastName ? ' ' + task.CreatedByUser.LastName : '');
  const assignedTo = task.AssignedToUser?.FirstName + (task.AssignedToUser?.LastName ? ' ' + task.AssignedToUser.LastName : '');
  const assignedAvatar = task.AssignedToUser?.AvatarUrl;

  const clickGuard = usePointerClickGuard(onClick);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-pointer"
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div
          className="p-4 space-y-3"
          onPointerDown={clickGuard.onPointerDown}
          onPointerUp={clickGuard.onPointerUp}
          role="button"
          tabIndex={0}
        >
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-900 text-sm">{task.Title}</h4>
            <span className={`rounded px-2 py-1 text-xs font-medium ${getPriorityColor(priorityLabel)}`}>{priorityLabel}</span>
          </div>
          {/* Task Description */}
          <p className="text-xs text-gray-600 line-clamp-2">{task.Description}</p>
          {/* Project Name */}
          <div className="text-xs text-blue-600 font-medium">{task.ProjectName}</div>
          {/* Task Details */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-xs">
              <span className="text-gray-500 mr-1">Assigned to:</span>
              {assignedAvatar && <Avatar src={assignedAvatar} alt={assignedTo} size="sm" />}
              <span className="ml-1 font-medium text-blue-600">{assignedTo}</span>
            </div>
            <div className="text-xs">
              <span className="text-gray-500 mr-1">Created by:</span>
              <span className="font-medium text-gray-900">{createdBy}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              Due: {task.EstimatedDeadline ? new Date(task.EstimatedDeadline).toLocaleDateString() : 'No deadline'}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {assignedAvatar && <Avatar src={assignedAvatar} alt={assignedTo} size="sm" />}
                <span className="text-xs text-gray-600">{assignedTo}</span>
              </div>
              <div className="text-xs text-gray-500">ID: {task.CreatedByUserId}</div>
            </div>
          </div>
          {/* Created Date */}
          <div className="text-xs text-gray-400 border-t pt-2">
            Created: {task.CreatedAt ? new Date(task.CreatedAt).toLocaleDateString() : ''}
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

  // Status icon for header
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-4 h-4" />;
      case 'inprogress': return <PlayCircle className="w-4 h-4" />;
      case 'todo': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {getStatusIcon(status)}
          {title}
        </h3>
        <Badge variant="secondary" className="text-xs">{tasks.length + columnSubtasks.length}</Badge>
      </div>
      <div ref={setNodeRef} className="rounded-xl p-4 border border-gray-200 shadow-sm"> {/* droppable area */}
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
            {(tasks.length + columnSubtasks.length === 0) && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm">No {title.toLowerCase()} tasks</p>
              </div>
            )}
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

  // Get unique projects and freelancers from tasks
  const projects = useMemo(() => {
    const set = new Set(tasks.map(t => t.ProjectName || ''));
    return Array.from(set).filter(Boolean);
  }, [tasks]);
  const freelancers = useMemo(() => {
    const set = new Set(tasks.map(t => t.AssignedToUser?.FirstName + (t.AssignedToUser?.LastName ? ' ' + t.AssignedToUser.LastName : '')));
    return Array.from(set).filter(Boolean);
  }, [tasks]);

  // FILTER STATE
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState('all');

  // Unique projects and freelancers from Kanban data
  const uniqueProjects = useMemo(() => {
    const set = new Set(tasks.map(t => t.ProjectName || ''));
    return Array.from(set).filter(Boolean);
  }, [tasks]);
  const uniqueFreelancers = useMemo(() => {
    const set = new Set(tasks.map(t => t.AssignedToUser?.FirstName + (t.AssignedToUser?.LastName ? ' ' + t.AssignedToUser.LastName : '')));
    return Array.from(set).filter(Boolean);
  }, [tasks]);

  // FILTERED TASKS
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesProject = selectedProject === 'all' || task.ProjectName === selectedProject;
      const matchesStatus = selectedStatus === 'all' ||
        (selectedStatus === 'To Do' && task.Status === KanbanTaskStatus.ToDo) ||
        (selectedStatus === 'In Progress' && task.Status === KanbanTaskStatus.InProgress) ||
        (selectedStatus === 'Done' && task.Status === KanbanTaskStatus.Done);
      const assignedName = task.AssignedToUser?.FirstName + (task.AssignedToUser?.LastName ? ' ' + task.AssignedToUser.LastName : '');
      const matchesFreelancer = selectedFreelancer === 'all' || assignedName === selectedFreelancer;
      return matchesProject && matchesStatus && matchesFreelancer;
    });
  }, [tasks, selectedProject, selectedStatus, selectedFreelancer]);

  // GROUP TASKS BY STATUS
  const tasksByStatus = useMemo(() => ({
    'To Do': filteredTasks.filter(t => t.Status === KanbanTaskStatus.ToDo),
    'In Progress': filteredTasks.filter(t => t.Status === KanbanTaskStatus.InProgress),
    'Done': filteredTasks.filter(t => t.Status === KanbanTaskStatus.Done),
  }), [filteredTasks]);

  // CLEAR FILTERS
  const clearFilters = () => {
    setSelectedProject('all');
    setSelectedStatus('all');
    setSelectedFreelancer('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Tasks</h1>
          <p className="text-gray-600 mt-1">View and track project tasks (Read-only)</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddTaskModal(true)} className="ml-4" variant="primary">
          Create Task
        </Button>
      </div>
      {/* Filters */}
      <Card>
        <div className="border-b p-4">
          <div className="font-semibold text-lg">Filter Tasks</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="border rounded px-3 py-2">
              <option value="all">All Projects</option>
              {uniqueProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border rounded px-3 py-2">
              <option value="all">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <select value={selectedFreelancer} onChange={e => setSelectedFreelancer(e.target.value)} className="border rounded px-3 py-2">
              <option value="all">All Freelancers</option>
              {uniqueFreelancers.map(freelancer => (
                <option key={freelancer} value={freelancer}>{freelancer}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>
      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={tasksByStatus['To Do']}
            onTaskClick={handleTaskClick}
            setShowAddTaskModal={setShowAddTaskModal}
            subtasks={subtasks}
            setEditSubtask={setSelectedSubtask}
          />
          <KanbanColumn
            title="In Progress"
            status="inprogress"
            tasks={tasksByStatus['In Progress']}
            onTaskClick={handleTaskClick}
            setShowAddTaskModal={setShowAddTaskModal}
            subtasks={subtasks}
            setEditSubtask={setSelectedSubtask}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={tasksByStatus['Done']}
            onTaskClick={handleTaskClick}
            setShowAddTaskModal={setShowAddTaskModal}
            subtasks={subtasks}
            setEditSubtask={setSelectedSubtask}
          />
        </div>
      </DndContext>
      {/* Summary Stats */}
      <Card>
        <div className="border-b p-4">
          <div className="font-semibold text-lg">Task Summary</div>
          <div className="text-gray-500 text-sm">Overview of all project tasks</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{filteredTasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tasksByStatus['In Progress'].length}</div>
              <div className="text-sm text-blue-700">In Progress</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{tasksByStatus['Done'].length}</div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{filteredTasks.filter(t => t.Priority === KanbanTaskPriorityLevel.Urgent || t.Priority === KanbanTaskPriorityLevel.High).length}</div>
              <div className="text-sm text-yellow-700">High Priority</div>
            </div>
          </div>
        </div>
      </Card>
      {/* No tasks found */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">Tasks will appear here when freelancers create them.</p>
        </div>
      )}
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
    </div>
  );
}