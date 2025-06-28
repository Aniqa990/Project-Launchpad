using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IUserRepository
    {
        // for login and Signup
        Task<User> GetUserByEmailAsync(string email);
        Task<bool> UserExistsAsync(string email);
        Task AddUserAsync(User user);

        // 
    }
}
