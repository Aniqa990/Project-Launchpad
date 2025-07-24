using Microsoft.EntityFrameworkCore;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.DataAccess.Repositories.IRepositories;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO;
using ProjectLaunchpad.Models.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories
{
    public class MilestoneRepository : IMilestoneRepository
    {
        private readonly ApplicationDbContext _db;

        public MilestoneRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IEnumerable<Milestone>> GetAllMilestonesAsync()
        {
            return await _db.milestones.ToListAsync();
        }

        public async Task<Milestone> GetMilestoneByIdAsync(int id)
        {
            return await _db.milestones.FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task AddMilestoneAsync(Milestone milestone)
        {
            await _db.milestones.AddAsync(milestone);
        }

        public async Task UpdateMilestoneAsync(Milestone milestone)
        {
            _db.milestones.Update(milestone);
            await _db.SaveChangesAsync();
        }

        public async Task DeleteMilestoneAsync(int id)
        {
            var milestone = await _db.milestones
                .FirstOrDefaultAsync(m => m.Id == id);

            if (milestone != null)
            {
                _db.milestones.Remove(milestone);
                await _db.SaveChangesAsync();
            }
        }

        public async Task<IEnumerable<Milestone>> GetMilestonesByProjectIdAsync(int projectId)
        {
            return await _db.milestones
                .Where(m => m.ProjectId == projectId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Milestone>> GetPendingMilestonesAsync()
        {
            return await _db.milestones
                .Where(m => m.Status == MilestoneStatus.NotSelected)
                .ToListAsync();
        }

        public async Task<IEnumerable<Milestone>> GetSubmittedMilestonesAsync()
        {
            return await _db.milestones
                .Where(m => m.Status == MilestoneStatus.Completed)
                .ToListAsync();
        }

        public async Task<IEnumerable<Milestone>> GetUnderReviewMilestonesAsync()
        {
            return await _db.milestones
                .Where(m => m.Status == MilestoneStatus.InProgress).ToListAsync();
        }

        //public async Task<IEnumerable<Milestone>> GetMilestonesByHandoverStatusAsync(string status)
        //{
        //    return await _db.milestones
        //        .Where(m => m.HandoverStatus == status)
        //        .ToListAsync();
        //}

        public async Task<IEnumerable<MilestoneWithPaymentDTO>> GetMilestonesByHandoverStatusAsync(string status)
        {
            var result = await (from m in _db.milestones
                                where m.HandoverStatus == status && m.Status == MilestoneStatus.Completed
                                join p in _db.payments on m.Id equals p.MilestoneId into mp
                                from payment in mp.DefaultIfEmpty()
                                where payment.PaymentStatus == "paid"
                                join d in _db.deliverables on m.Id equals d.MilestoneId into md
                                from deliverable in md.DefaultIfEmpty()
                                select new MilestoneWithPaymentDTO
                                {
                                    id = m.Id,
                                    title = m.Title,
                                    description = m.Description,
                                    dueDate = m.DueDate,
                                    amount = m.Amount,
                                    status = m.Status,
                                    isApproved = m.IsApproved,
                                    submittedFileUrls = deliverable != null ? deliverable.uploadFiles : null,
                                    submissionDate = m.SubmissionDate,
                                    freelancerComments = m.FreelancerComments,
                                    projectId = m.ProjectId,
                                    paymentId = payment != null ? payment.Id : (int?)null,
                                    freelancerId = payment != null ? payment.FreelancerId : (int?)null,
                                    paymentStatus = payment != null ? payment.PaymentStatus : null,
                                    paymentDate = payment != null ? payment.PaymentDate : DateTime.Now, //fix this later
                                    transactionReference = payment != null ? payment.TransactionReference : null
                                }).ToListAsync();
            return result;
        }

        //public async Task<IEnumerable<MilestoneWithUserDTO>> GetMilestonesByHandoverStatusAsync(string status)
        //{
        //    var result = await (
        //        from m in _db.milestones
        //        where m.HandoverStatus == status && m.Status == MilestoneStatus.Submitted
        //        join p in _db.projects on m.ProjectId equals p.Id
        //        join freelancerUser in _db.users on m.FreelancerId equals freelancerUser.Id into fGroup
        //        from freelancerUser in fGroup.DefaultIfEmpty()
        //        join clientUser in _db.users on p.ClientId equals clientUser.Id into cGroup
        //        from clientUser in cGroup.DefaultIfEmpty()
        //        select new MilestoneWithUserDTO
        //        {
        //            id = m.Id,
        //            title = m.Title,
        //            description = m.Description,
        //            dueDate = m.DueDate,
        //            amount = m.Amount,
        //            status = m.Status,
        //            isApproved = m.IsApproved,
        //            submittedFileUrls = m.SubmittedFileUrls,
        //            submissionDate = m.SubmissionDate,
        //            freelancerComments = m.FreelancerComments,
        //            projectId = m.ProjectId,
        //            freelancerId = m.FreelancerId,
        //            clientId = p.ClientId,
        //            freelancerFirstName = freelancerUser != null ? freelancerUser.FirstName : null,
        //            freelancerLastName = freelancerUser != null ? freelancerUser.LastName : null,
        //            freelancerEmail = freelancerUser != null ? freelancerUser.Email : null,
        //            clientFirstName = clientUser != null ? clientUser.FirstName : null,
        //            clientLastName = clientUser != null ? clientUser.LastName : null,
        //            clientEmail = clientUser != null ? clientUser.Email : null
        //        }
        //    ).ToListAsync();

        //    return result;
        //}

        public async Task UpdateHandoverStatusAsync(int id, string newStatus)
        {
            var milestone = await _db.milestones.FirstOrDefaultAsync(m => m.Id == id);
            if (milestone != null)
            {
                milestone.HandoverStatus = newStatus;
                await _db.SaveChangesAsync();
            }
        }
    }
}
