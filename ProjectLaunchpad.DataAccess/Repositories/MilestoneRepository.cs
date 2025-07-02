using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class MilestoneRepository : IMilestoneRepository
    {
        private readonly ApplicationDbContext _db;

        public MilestoneRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Milestone>> GetAllMilestonesAsync()
        {
            return await _db.milestones.ToListAsync();
        }

        public async Task<Milestone> GetMilestoneByIdAsync(int id)
        {
            return await _db.milestones.FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddMilestoneAsync(Milestone milestone)
        {
            await _db.milestones.AddAsync(milestone);
        }

        public async Task UpdateMilestoneAsync(Milestone milestone)
        {
            _db.milestones.Update(milestone);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteMilestoneAsync(int id)
        {
            var milestone = await _db.milestones
                .FirstOrDefaultAsync(m => m.Id == id);

            if (milestone != null)
            {
                _db.milestones.Remove(milestone);
                await _db.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Milestone>> GetMilestonesByProjectIdAsync(int projectId)
        {
            return await _db.milestones
                .Where(m => m.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Milestone>> GetPendingMilestonesAsync()
        {
            return await _db.milestones
                .Where(m => m.Status == MilestoneStatus.Pending)
                .ToListAsync();
        }

        public async Task<IEnumerable<Milestone>> GetSubmittedMilestonesAsync()
        {
            return await _db.milestones
                .Where(m => m.Status == MilestoneStatus.Submitted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Milestone>> GetUnderReviewMilestonesAsync()
        {
            return await _db.milestones
                .Where(m => m.Status == MilestoneStatus.UnderReview).ToListAsync();
        }
    }
}
