using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IMilestoneRepository
    {
        Task<IEnumerable<Milestone>> GetAllMilestonesAsync();
        Task<Milestone> GetMilestoneByIdAsync(int id);
        Task AddMilestoneAsync(Milestone milestone);
        Task UpdateMilestoneAsync(Milestone milestone);
        Task DeleteMilestoneAsync(int id);
        Task<IEnumerable<Milestone>> GetMilestonesByProjectIdAsync(int projectId);
        Task<IEnumerable<Milestone>> GetPendingMilestonesAsync();
        Task<IEnumerable<Milestone>> GetSubmittedMilestonesAsync();
        Task<IEnumerable<Milestone>> GetUnderReviewMilestonesAsync();
        Task<IEnumerable<MilestoneWithPaymentDTO>> GetMilestonesByHandoverStatusAsync(string status);
        Task UpdateHandoverStatusAsync(int id, string newStatus);

        // Assign a milestone to a freelancer
        Task AssignMilestoneToFreelancerAsync(int milestoneId, int userId);

        // Get all milestones assigned to a freelancer
        Task<IEnumerable<Milestone>> GetMilestonesByFreelancerIdAsync(int userId);

        Task<IEnumerable<FreelancerMilestoneDTO>> getMilestoneFreelancers(int milestoneId);

        // Get a specific assignment entry
        Task<FreelancerMilestone> GetFreelancerMilestoneAsync(int milestoneId, int userId);

        // Remove a milestone assignment from freelancer (if needed)
        Task UnassignMilestoneFromFreelancerAsync(int milestoneId, int userId);

    }
}
