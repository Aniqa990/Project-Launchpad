using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface ISubTaskRepository
    {
        Task<IEnumerable<Subtask>> GetAllAsync(int ParenttaskId);

        Task<IEnumerable<Subtask>> GetAllAsync();
        Task<Subtask> GetByIdAsync(int id);
        Task AddAsync(Subtask task);
        void Update(Subtask task);
        void Delete(Subtask task);

        Task DeleteByIdAsync(int id); // ✅ Now async



    }
}
