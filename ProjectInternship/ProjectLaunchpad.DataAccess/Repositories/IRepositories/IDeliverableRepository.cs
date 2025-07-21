using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IDeliverablesRepository
    {
        Task<IEnumerable<Deliverables>> GetAllAsync();
        Task<Deliverables?> GetByIdAsync(int id);
        Task<IEnumerable<Deliverables>> GetByProjectIdAsync(int projectId);

        Task<IEnumerable<Deliverables>> GetByMilestoneIdAsync(int milestoneId);
        Task AddAsync(Deliverables deliverable);
        Task UpdateAsync(Deliverables deliverable);
        Task DeleteAsync(int id);
    }

}
