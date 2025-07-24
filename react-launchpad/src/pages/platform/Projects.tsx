import { useEffect, useState } from "react";
import { getProjectsWithPendingApproval, updateProjectApprovalStatus, getMilestonesByProjectId } from "@/apiendpoints";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Project, Milestone } from "@/types";
import toast from 'react-hot-toast';

export function AdminProjectApprovals() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [rejectingProject, setRejectingProject] = useState<Project | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const data = await getProjectsWithPendingApproval();
    setProjects(data);
  };

  const handleApprove = async (projectId: number) => {
    setLoading(true);
    try {
      await updateProjectApprovalStatus(projectId, "approved");
      await fetchProjects();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (project: Project) => {
    setRejectingProject(project);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectingProject) return;
    setLoading(true);
    try {
      await updateProjectApprovalStatus(rejectingProject.id, "rejected", rejectionReason);
      await fetchProjects();
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectingProject(null);
      setSelectedProject(null);
      setShowMilestoneModal(false);
      setMilestones([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeline = (project: Project) => {
    const start = (project as any).startDate || project.deadline || "";
    const end = project.deadline || "";
    return {
      start: start ? new Date(start).toLocaleDateString() : "",
      end: end ? new Date(end).toLocaleDateString() : "",
    };
  };

  // Fetch milestones when opening the modal
  const openMilestoneModal = async (project: Project) => {
    setSelectedProject(project);
    setShowMilestoneModal(true);
    setMilestones([]);
    setMilestonesLoading(true);
    try {
      const data = await getMilestonesByProjectId(project.id);
      setMilestones(data);
    } catch (e) {
      setMilestones([]);
    } finally {
      setMilestonesLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Pending Project Approvals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project: Project) => {
          const { start, end } = getTimeline(project);
          return (
            <div key={project.id} className="bg-white rounded-xl shadow p-6 flex flex-col">
              <h3 className="text-lg font-semibold">{project.projectTitle}</h3>
              <p className="text-gray-600 mb-2">{project.description}</p>
              <div className="mb-2">
                <span className="font-medium">Category:</span> {project.categoryOrDomain}
              </div>
              <div className="mb-2">
                <span className="font-medium">Timeline:</span>{" "}
                <span>
                  {start}
                  {end && start !== end ? ` to ${end}` : ""}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Budget:</span> ${project.budget}
              </div>
              <Button
                variant="outline"
                className="mb-2"
                onClick={() => openMilestoneModal(project)}
              >
                View Milestones
              </Button>
              <div className="flex space-x-2 mt-auto">
                <Button
                  variant="secondary"
                  onClick={() => handleApprove(project.id)}
                  disabled={loading}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleReject(project)}
                  disabled={loading}
                >
                  Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestone Modal */}
      <Modal
        isOpen={!!selectedProject && showMilestoneModal}
        onClose={() => { setSelectedProject(null); setShowMilestoneModal(false); setMilestones([]); }}
        title={selectedProject ? `Milestones for ${selectedProject.projectTitle}` : ""}
        size="md"
      >
        {milestonesLoading ? (
          <div className="text-center py-8">Loading milestones...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {milestones.length === 0 ? (
              <div className="text-gray-500">No milestones found for this project.</div>
            ) : (
              milestones.map((milestone) => (
                <div key={milestone.id} className="mb-4 p-4 border rounded">
                  <div className="font-semibold">{milestone.title}</div>
                  <div>{milestone.description}</div>
                  <div>Amount: ${milestone.amount}</div>
                  <div>
                    Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <Button className="mt-4" onClick={() => setShowMilestoneModal(false)}>Close</Button>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingProject && showRejectModal}
        onClose={() => { setRejectingProject(null); setShowRejectModal(false); }}
        title={rejectingProject ? `Reject Project: ${rejectingProject.projectTitle}` : ""}
        size="sm"
      >
        <Textarea
          placeholder="Enter reason for rejection"
          value={rejectionReason}
          onChange={e => setRejectionReason(e.target.value)}
          className="mb-4"
        />
        <div className="flex space-x-2">
          <Button variant="danger" onClick={confirmReject} disabled={loading || !rejectionReason}>
            Confirm Reject
          </Button>
          <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}