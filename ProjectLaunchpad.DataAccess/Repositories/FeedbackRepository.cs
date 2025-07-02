using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class FeedbackRepository : IFeedbackRepository
    {
        private readonly ApplicationDbContext _db;

        public FeedbackRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task AddFeedbackAsync(Feedback feedback)
        {
            await _db.Feedbacks.AddAsync(feedback);
        }

        public async Task<Feedback?> GetFeedbackByIdAsync(int id)
        {
            return await _db.Feedbacks.FindAsync(id);
        }

        public async Task<IEnumerable<Feedback>> GetFeedbacksByFreelancerAsync(int freelancerId)
        {
            return await _db.Feedbacks
                .Where(f => f.FreelancerId == freelancerId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Feedback>> GetFeedbacksByProjectAsync(int projectId)
        {
            return await _db.Feedbacks
                .Where(f => f.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Feedback>> GetAllFeedbacksAsync()
        {
            return await _db.Feedbacks.ToListAsync();
        }

        public async Task DeleteFeedbackAsync(int id)
        {
            var feedback = await _db.Feedbacks.FindAsync(id);
            if (feedback != null)
            {
                _db.Feedbacks.Remove(feedback);
            }
        }
    }
}
