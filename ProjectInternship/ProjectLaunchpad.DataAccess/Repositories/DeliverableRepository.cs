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
    public class DeliverablesRepository : IDeliverablesRepository
    {
        private readonly ApplicationDbContext _db;

        public DeliverablesRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Deliverables>> GetAllAsync()
            => await _db.deliverables.ToListAsync();

        public async Task<Deliverables?> GetByIdAsync(int id)
            => await _db.deliverables.FirstOrDefaultAsync(d => d.Id == id);

        public async Task<IEnumerable<Deliverables>> GetByMilestoneIdAsync(int milestoneId)
            => await _db.deliverables.Where(d => d.MilestoneId == milestoneId).ToListAsync();

        public async Task AddAsync(Deliverables deliverable)
        {
            await _db.deliverables.AddAsync(deliverable);
        }

        public async Task UpdateAsync(Deliverables deliverable)
        {
            _db.deliverables.Update(deliverable);
            await _db.SaveChangesAsync();
        }

        public async Task<IEnumerable<Deliverables>> GetByProjectIdAsync(int projectId)
    => await _db.deliverables.Where(d => d.projectId == projectId).ToListAsync();


        public async Task DeleteAsync(int id)
        {
            var deliverable = await _db.deliverables.FindAsync(id);
            if (deliverable != null)
            {
                _db.deliverables.Remove(deliverable);
                await _db.SaveChangesAsync();
            }
        }

    }

}
