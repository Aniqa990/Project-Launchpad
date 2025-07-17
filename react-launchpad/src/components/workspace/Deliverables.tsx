import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileText, Download, Upload } from 'lucide-react';
import { Deliverable } from '../../types';
import { Modal } from '../ui/Modal';

export default function Deliverables({
  deliverables,
  deliverablesLoading,
  user,
  handleCreateDeliverable,
  handleUpdateDeliverable,
  handleDeleteDeliverable,
  selectedDeliverable,
  deliverableModalOpen,
  setDeliverableModalOpen,
  setSelectedDeliverable,
  deliverableFormLoading,
  deliverableError,
  projectId
}: {
  deliverables: Deliverable[];
  deliverablesLoading: boolean;
  user: any;
  handleCreateDeliverable: (form: Partial<Deliverable>) => void;
  handleUpdateDeliverable: (id: number, form: Partial<Deliverable>) => void;
  handleDeleteDeliverable: (id: number) => void;
  selectedDeliverable: Deliverable | null;
  deliverableModalOpen: boolean;
  setDeliverableModalOpen: (open: boolean) => void;
  setSelectedDeliverable: (d: Deliverable | null) => void;
  deliverableFormLoading: boolean;
  deliverableError: string | null;
  projectId: number;
}) {
  // DeliverableModal moved here for encapsulation
  function DeliverableModal({ isOpen, onClose, onSubmit, loading, error, deliverable, projectId }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (form: { uploadFiles: string; projectId: number; comment: string; status: string }) => void;
    loading: boolean;
    error: string | null;
    deliverable: Deliverable | null;
    projectId: number;
  }) {
    const [form, setForm] = React.useState<{ uploadFiles: string; projectId: number; comment: string; status: string }>({ uploadFiles: '', projectId, comment: '', status: 'Submitted' });
    React.useEffect(() => {
      if (deliverable) {
        setForm({
          uploadFiles: deliverable.uploadFiles,
          projectId,
          comment: deliverable.comment,
          status: deliverable.Status,
        });
      } else {
        setForm({ uploadFiles: '', projectId, comment: '', status: 'Submitted' });
      }
    }, [deliverable, projectId]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(form);
    };
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={deliverable ? 'Edit Deliverable' : 'Upload Deliverable'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-projectId">Project ID</label>
          <input id="deliverable-projectId" name="projectId" value={form.projectId} className="w-full border p-2 rounded bg-gray-100" readOnly />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-uploadFiles">File URL</label>
          <input id="deliverable-uploadFiles" name="uploadFiles" value={form.uploadFiles} onChange={handleChange} className="w-full border p-2 rounded" required />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-comment">Comment</label>
          <textarea id="deliverable-comment" name="comment" value={form.comment} onChange={handleChange} className="w-full border p-2 rounded" />
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deliverable-status">Status</label>
          <select id="deliverable-status" name="status" value={form.status} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
          </select>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Project Deliverables</h3>
        {user?.role === 'freelancer' && (
          <Button size="sm" icon={Upload} onClick={() => { setDeliverableModalOpen(true); setSelectedDeliverable(null); }}>Upload File</Button>
        )}
      </div>
      {deliverablesLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((deliverable) => (
            <Card key={deliverable.Id} hover>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{deliverable.uploadFiles.split('/').pop()}</h4>
                  <p className="text-sm text-gray-500">{deliverable.comment}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={deliverable.Status === 'Submitted' ? 'warning' : 'success'}>
                  {deliverable.Status}
                </Badge>
                <div className="flex space-x-2">
                  <a
                    href={deliverable.uploadFiles}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mr-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                  {user?.role === 'freelancer' && (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedDeliverable(deliverable); setDeliverableModalOpen(true); }}>Edit</Button>
                  )}
                  {user?.role === 'freelancer' && (
                    <Button size="sm" variant="outline" onClick={() => handleDeleteDeliverable(deliverable.Id)}>Delete</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <DeliverableModal
        isOpen={deliverableModalOpen}
        onClose={() => { setDeliverableModalOpen(false); setSelectedDeliverable(null); }}
        onSubmit={(form) => {
          if (selectedDeliverable) {
            handleUpdateDeliverable(selectedDeliverable.Id, form);
          } else {
            handleCreateDeliverable(form);
          }
        }}
        loading={deliverableFormLoading}
        error={deliverableError}
        deliverable={selectedDeliverable}
        projectId={projectId}
      />
    </div>
  );
} 