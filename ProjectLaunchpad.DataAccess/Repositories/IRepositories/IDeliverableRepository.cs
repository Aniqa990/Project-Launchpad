using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IDeliverableRepository
    {
        Task<IEnumerable<Deliverables>> GetAllAsync();
        Task<Deliverables> GetByIdAsync(int id);
        Task AddAsync(Deliverables deliverable);
        void Update(Deliverables deliverable);
        void Delete(Deliverables deliverable);
    }
}
