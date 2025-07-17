import React, { useState, useEffect } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Trash2, Calendar as CalendarIcon, X } from "lucide-react";
import { Experience } from "@/types";
import DatePicker from "react-datepicker";

export function ExperienceModal({ open, onClose, onSave, onDelete, initialData }: {
  open: boolean;
  onClose: () => void;
  onSave: (exp: Experience) => void;
  onDelete?: (id: number) => void;
  initialData: Experience | null;
}) {
  const [fields, setFields] = useState<Experience>(initialData || {
    Id: 0,
    Company: '',
    Title: '',
    StartDate: '',
    EndDate: '',
    Description: '',
    Source: 'manual',
  });
  useEffect(() => {
    setFields(initialData || {
      Id: 0,
      Company: '',
      Title: '',
      StartDate: '',
      EndDate: '',
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
          {fields.Id ? 'Edit Experience' : 'Add Experience'}
        </h3>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSave(fields); }}>
          <div className="space-y-2">
            <Label htmlFor="exp-title">Title</Label>
            <Input
              id="exp-title"
              value={fields.Title}
              onChange={e => setFields(f => ({ ...f, Title: e.target.value }))}
              className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="Frontend Developer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-company">Company</Label>
            <Input
              id="exp-company"
              value={fields.Company}
              onChange={e => setFields(f => ({ ...f, Company: e.target.value }))}
              className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="Company Name"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Start Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4 pointer-events-none" />
                <DatePicker
                  selected={fields.StartDate ? new Date(fields.StartDate) : null}
                  onChange={date => setFields(f => ({ ...f, StartDate: date ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '' }))}
                  dateFormat="MMM yyyy"
                  showMonthYearPicker
                  className="pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm w-full"
                  placeholderText="Start Date"
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label>End Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4 pointer-events-none" />
                <DatePicker
                  selected={fields.EndDate && fields.EndDate !== 'Present' ? new Date(fields.EndDate) : null}
                  onChange={date => setFields(f => ({ ...f, EndDate: date ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '' }))}
                  dateFormat="MMM yyyy"
                  showMonthYearPicker
                  className={`pl-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm w-full ${fields.EndDate === 'Present' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  placeholderText="End Date"
                  disabled={fields.EndDate === 'Present'}
                />
              </div>
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id="exp-current"
                  checked={fields.EndDate === 'Present'}
                  onChange={e => setFields(f => ({ ...f, EndDate: e.target.checked ? 'Present' : '' }))}
                  className="mr-2"
                />
                <Label htmlFor="exp-current" className="text-sm">Current</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exp-desc">Description</Label>
            <Textarea
              id="exp-desc"
              value={fields.Description}
              onChange={e => setFields(f => ({ ...f, Description: e.target.value }))}
              rows={4}
              className="rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder="Describe your responsibilities and accomplishments"
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