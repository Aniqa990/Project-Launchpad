import React, { useState, useEffect } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Trash2, X } from "lucide-react";
import { ProjectItem } from "@/types";

export function ProjectModal({ open, onClose, onSave, onDelete, initialData }: {
  open: boolean;
  onClose: () => void;
  onSave: (proj: ProjectItem) => void;
  onDelete?: (id: number) => void;
  initialData: ProjectItem | null;
}) {
  const [fields, setFields] = useState<ProjectItem>(initialData || {
    Id: 0,
    Title: '',
    Description: '',
    Source: 'manual',
  });
  useEffect(() => {
    setFields(initialData || {
      Id: 0,
      Title: '',
      Description: '',
      Source: 'manual',
    });
  }, [initialData, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {fields.Id ? 'Edit Project' : 'Add Project'}
        </h3>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSave(fields); }}>
          <div className="space-y-2">
            <Label htmlFor="proj-title">Title</Label>
            <Input
              id="proj-title"
              value={fields.Title}
              onChange={e => setFields(f => ({ ...f, Title: e.target.value }))}
              className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="Ecommerce Web App"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              value={fields.Description}
              onChange={e => setFields(f => ({ ...f, Description: e.target.value }))}
              rows={4}
              className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="Describe the project"
            />
          </div>
          <div className="flex justify-between gap-2 mt-4">
            {fields.Id !== 0 && onDelete && (
              <Button type="button" variant="danger" onClick={() => onDelete(fields.Id)} className="flex items-center"><Trash2 className="w-4 h-4 mr-1" />Remove</Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white">
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}