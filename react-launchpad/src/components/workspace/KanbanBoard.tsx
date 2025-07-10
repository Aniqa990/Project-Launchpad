import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
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
import { Task } from '../../types';
import { mockTasks } from '../../utils/mockData';

interface KanbanColumnProps {
  title: string;
  status: 'todo' | 'inprogress' | 'done';
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

interface SortableTaskProps {
  task: Task;
  onClick: () => void;
}

function SortableTask({ task, onClick }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="mb-3 cursor-pointer"
    >
      <Card hover padding="sm" className="border border-gray-200">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h3>
            <Badge 
              variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}
              size="sm"
            >
              {task.priority}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {task.actualHours}h/{task.estimatedHours}h
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>
            <Avatar src={task.assignee.avatar} size="sm" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function KanbanColumn({ title, status, tasks, onTaskClick }: KanbanColumnProps) {
  const statusColors = {
    todo: 'bg-gray-100',
    inprogress: 'bg-blue-100',
    done: 'bg-green-100'
  };

  return (
    <div className="flex-1 min-w-80">
      <div className={`rounded-lg p-4 ${statusColors[status]}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 capitalize">
            {title} ({tasks.length})
          </h2>
          <Button variant="ghost" size="sm" icon={Plus}>
            Add Task
          </Button>
        </div>
        
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-96">
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
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

export function KanbanBoard() {
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine new status based on drop zone
    let newStatus: 'todo' | 'inprogress' | 'done' = activeTask.status;
    
    // If dropping on a different column, update status
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask && overTask.status !== activeTask.status) {
      newStatus = overTask.status;
    }

    if (active.id !== over.id || newStatus !== activeTask.status) {
      const updatedTasks = tasks.map(task => 
        task.id === active.id 
          ? { ...task, status: newStatus }
          : task
      );
      setTasks(updatedTasks);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress');
  const doneTasks = tasks.filter(t => t.status === 'done');

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
          />
          <KanbanColumn
            title="In Progress"
            status="inprogress"
            tasks={inProgressTasks}
            onTaskClick={handleTaskClick}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={doneTasks}
            onTaskClick={handleTaskClick}
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
                  {selectedTask.title}
                </h2>
                <p className="text-gray-600">{selectedTask.description}</p>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button variant="outline" size="sm" icon={Edit3}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" icon={Trash2}>
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignee
                </label>
                <div className="flex items-center space-x-3">
                  <Avatar src={selectedTask.assignee.avatar} size="sm" />
                  <span className="text-sm text-gray-900">{selectedTask.assignee.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <Badge 
                  variant={selectedTask.priority === 'high' ? 'danger' : selectedTask.priority === 'medium' ? 'warning' : 'default'}
                >
                  {selectedTask.priority}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(selectedTask.dueDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Tracking
                </label>
                <div className="flex items-center text-sm text-gray-900">
                  <Clock className="w-4 h-4 mr-2" />
                  {selectedTask.actualHours}h / {selectedTask.estimatedHours}h
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((selectedTask.actualHours / selectedTask.estimatedHours) * 100, 100)}%` }}
                  />
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
    </>
  );
}