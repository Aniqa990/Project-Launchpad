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
    public class DeliverableRepository:IDeliverableRepository
    {
        private readonly ApplicationDbContext _db;

        public DeliverableRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Deliverables>> GetAllAsync()
        {
            return await _db.deliverables.ToListAsync();
        }

        public async Task<Deliverables> GetByIdAsync(int id)
        {
            return await _db.deliverables.FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task AddAsync(Deliverables deliverable)
        {
            await _db.deliverables.AddAsync(deliverable);
        }

        public void Update(Deliverables deliverable)
        {
            _db.deliverables.Update(deliverable);
        }

        public void Delete(Deliverables deliverable)
        {
            _db.deliverables.Remove(deliverable);
        }
    }
}
