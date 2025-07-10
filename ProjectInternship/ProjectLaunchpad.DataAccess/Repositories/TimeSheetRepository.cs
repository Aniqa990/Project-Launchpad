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
    public class TimeSheetRepository : ITimeSheetRepository
    {
        private readonly ApplicationDbContext _db;

        public TimeSheetRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task AddTimeSheetAsync(TimeSheet timeSheet)
        {
            await _db.TimeSheets.AddAsync(timeSheet);
        }

        public async Task<IEnumerable<TimeSheet>> GetAllTimeSheetsAsync()
        {
            return await _db.TimeSheets.ToListAsync();
        }

        public async Task<TimeSheet?> GetTimeSheetByIdAsync(int id)
        {
            return await _db.TimeSheets.FindAsync(id);
        }

        public async Task<IEnumerable<TimeSheet>> GetTimeSheetsByFreelancerAsync(string freelancerName)
        {
            return await _db.TimeSheets
                .Where(t => t.FreelancerName.ToLower() == freelancerName.ToLower())
                .ToListAsync();
        }

        public async Task<IEnumerable<TimeSheet>> GetTimeSheetsByDateAsync(DateTime date)
        {
            return await _db.TimeSheets
                .Where(t => t.DateOfWork.Date == date.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<TimeSheet>> GetTimeSheetsByProjectAsync(string projectName)
        {
            return await _db.TimeSheets
                .Where(t => t.ProjectName.ToLower() == projectName.ToLower())
                .ToListAsync();
        }

        public async Task ApproveTimeSheetAsync(int id, string reviewerComments = "")
        {
            var sheet = await _db.TimeSheets.FindAsync(id);
            if (sheet != null)
            {
                sheet.ApprovalStatus = "Approved";
                sheet.ReviewerComments = reviewerComments;
            }
        }

        public async Task RejectTimeSheetAsync(int id, string reviewerComments = "")
        {
            var sheet = await _db.TimeSheets.FindAsync(id);
            if (sheet != null)
            {
                sheet.ApprovalStatus = "Rejected";
                sheet.ReviewerComments = reviewerComments;
            }
        }

        public async Task DeleteTimeSheetAsync(int id)
        {
            var sheet = await _db.TimeSheets.FindAsync(id);
            if (sheet != null)
            {
                _db.TimeSheets.Remove(sheet);
            }
        }

        public async Task UpdateTimeSheetAsync(TimeSheet timeSheet)
        {
            _db.TimeSheets.Update(timeSheet);
        }
    }
}