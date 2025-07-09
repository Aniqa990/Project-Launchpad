import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Calendar, DollarSign, Download } from 'lucide-react';
import { Modal } from '../ui/Modal';

export default function Milestones({
  milestones,
  milestonesLoading,
  user,
  handleUpdateMilestone,
  selectedMilestone,
  setSelectedMilestone,
  milestoneFormLoading,
  milestoneError,
  projectId
}: {
  milestones: any[];
  milestonesLoading: boolean;
  user: any;
  handleUpdateMilestone: (id: number, update: any) => void;
  selectedMilestone: any | null;
  setSelectedMilestone: (m: any | null) => void;
  milestoneFormLoading: boolean;
  milestoneError: string | null;
  projectId: string | number;
}) {
  // MilestoneDetailModal moved here for encapsulation
  function MilestoneDetailModal({ milestone, isOpen, onClose, onSubmit, loading, milestoneError }: {
    milestone: any;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, update: any) => void;
    loading: boolean;
    milestoneError: string | null;
  }) {
    const [form, setForm] = React.useState<any>({});
    React.useEffect(() => {
      if (milestone) {
        setForm({
          title: milestone.Title,
          description: milestone.Description,
          dueDate: milestone.DueDate ? milestone.DueDate.split('T')[0] : '',
          amount: milestone.Amount,
          freelancerComments: milestone.FreelancerComments || '',
          submittedFileUrls: milestone.SubmittedFileUrls || '',
          submissionDate: milestone.SubmissionDate ? milestone.SubmissionDate.split('T')[0] : '',
          status: milestone.Status,
        });
      }
    }, [milestone]);
    if (!milestone) return null;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(milestone.Id, form);
    };
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Milestone Details" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {milestoneError && <div className="text-red-600 text-sm mb-2">{milestoneError}</div>}
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-title">Title</label>
          <input id="milestone-title" name="title" value={form.title || ''} onChange={handleChange} className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-description">Description</label>
          <textarea id="milestone-description" name="description" value={form.description || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-dueDate">Due Date</label>
          <input id="milestone-dueDate" name="dueDate" type="date" value={form.dueDate || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-amount">Amount</label>
          <input id="milestone-amount" name="amount" type="number" value={form.amount || ''} onChange={handleChange} className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-freelancerComments">Freelancer Comments</label>
          <textarea id="milestone-freelancerComments" name="freelancerComments" value={form.freelancerComments || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-submittedFileUrls">Submitted File URLs</label>
          <input id="milestone-submittedFileUrls" name="submittedFileUrls" value={form.submittedFileUrls || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-submissionDate">Submission Date</label>
          <input id="milestone-submissionDate" name="submissionDate" type="date" value={form.submissionDate || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="milestone-status">Status</label>
          <select id="milestone-status" name="status" value={form.status || 0} onChange={handleChange} className="w-full border p-2 rounded">
            <option value={0}>Pending</option>
            <option value={1}>Approved</option>
            <option value={2}>Paid</option>
          </select>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Project Milestones</h3>
        {user?.role === 'client' && (
          <Button size="sm">Add Milestone</Button>
        )}
      </div>
      {milestonesLoading ? (
        <div>Loading milestones...</div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <Card key={milestone.Id} className="cursor-pointer">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1"
                  onClick={() => setSelectedMilestone(milestone)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      milestone.Status === 2 ? 'bg-green-100 text-green-600' :
                      milestone.Status === 1 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{milestone.Title}</h4>
                    <Badge variant={
                      milestone.Status === 2 ? 'success' :
                      milestone.Status === 1 ? 'warning' : 'default'
                    }>
                      {milestone.Status === 2 ? 'Paid' : milestone.Status === 1 ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3 ml-11">{milestone.Description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 ml-11">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due {milestone.DueDate ? new Date(milestone.DueDate).toLocaleDateString() : 'No due date'}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${milestone.Amount?.toLocaleString()}
                    </div>
                  </div>
                  {milestone.SubmittedFileUrls && (
                    <div className="mt-3 ml-11">
                      <p className="text-sm font-medium text-gray-700 mb-1">Submitted Files:</p>
                      <a
                        href={milestone.SubmittedFileUrls}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        {milestone.SubmittedFileUrls}
                      </a>
                    </div>
                  )}
                  {milestone.FreelancerComments && (
                    <div className="mt-2 ml-11 text-xs text-gray-700">
                      <span className="font-medium">Freelancer Comments:</span> {milestone.FreelancerComments}
                    </div>
                  )}
                </div>
                <div className="ml-6 flex flex-col gap-2">
                  {milestone.Status === 1 && user?.role === 'client' && (
                    <Button size="sm" onClick={e => e.stopPropagation()}>Release Payment</Button>
                  )}
                  {milestone.Status === 2 && (
                    <a
                      href={milestone.SubmittedFileUrls}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mr-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <MilestoneDetailModal
        milestone={selectedMilestone}
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onSubmit={handleUpdateMilestone}
        loading={milestoneFormLoading}
        milestoneError={milestoneError}
      />
    </div>
  );
} 