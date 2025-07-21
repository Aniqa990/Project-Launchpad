using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _db;

        public UserRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _db.users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            return await _db.users.FirstOrDefaultAsync(u => u.Id == id);
        }
        public async Task<bool> UserExistsAsync(string email)
        {
            return await _db.users.AnyAsync(u => u.Email == email);
        }

        public async Task AddUserAsync(User user)
        {
            await _db.users.AddAsync(user);
        }
        public async Task UpdateUserAsync(User user)
        {
            _db.users.Update(user);
        }

        public async Task DeleteUserAsync(int userId)
        {
            var user = await GetUserByIdAsync(userId);
            if (user != null)
            {
                _db.users.Remove(user);
            }
        }
    }
}
