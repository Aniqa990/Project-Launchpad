using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IFreelancerProfileRepository
    {
        Task<FreelancerProfile?> GetProfileByUserIdAsync(int userId);
        Task AddFreelancerProfileAsync(FreelancerProfileDTO profile);
        Task UpdateFreelancerProfileAsync(FreelancerProfile profile);
        Task DeleteFreelancerProfileAsync(int userId);
        Task<List<FreelancerProfile>> GetAllFreelancerProfilesAsync();
    }
}
