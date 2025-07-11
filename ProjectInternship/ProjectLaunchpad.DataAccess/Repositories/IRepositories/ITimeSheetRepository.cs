using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface ITimeSheetRepository
    {
        Task AddTimeSheetAsync(TimeSheet timeSheet);
        Task<IEnumerable<TimeSheet>> GetAllTimeSheetsAsync();
        Task<TimeSheet?> GetTimeSheetByIdAsync(int id);
        Task<IEnumerable<TimeSheet>> GetTimeSheetsByFreelancerAsync(int freelancerId);
        Task<IEnumerable<TimeSheet>> GetTimeSheetsByDateAsync(DateTime date);
        Task<IEnumerable<TimeSheet>> GetTimeSheetsByProjectAsync(int projectId);
        Task ApproveTimeSheetAsync(int id, string reviewerComments = "");
        Task RejectTimeSheetAsync(int id, string reviewerComments = "");
        Task DeleteTimeSheetAsync(int id);
        Task UpdateTimeSheetAsync(TimeSheet timeSheet);
    }
}