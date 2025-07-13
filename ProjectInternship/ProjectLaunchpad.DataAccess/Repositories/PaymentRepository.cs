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
    public class PaymentRepository:IPaymentRepository
    {
        private readonly ApplicationDbContext _db;

        public PaymentRepository(ApplicationDbContext db)
        {
            _db= db;
        }

        public async Task<Payment> GetPaymentByIdAsync(int id)
        {
            return await _db.payments.FindAsync(id);
        }

        public async Task<IEnumerable<Payment>> GetAllPaymentsAsync()
        {
            return await _db.payments.ToListAsync();
        }

        public async Task AddPaymentAsync(Payment payment)
        {
            await _db.payments.AddAsync(payment);
            await _db.SaveChangesAsync();
        }


        public async Task<IEnumerable<Payment>> GetPaymentsByProjectIdAsync(int projectId)
        {
            return await _db.payments.Where(p => p.ProjectId == projectId).ToListAsync();
        }


        public async Task<IEnumerable<Payment>> GetPaymentsByFreelancerIdAsync(int freelancerId)
        {
            return await _db.payments.Where(p => p.FreelancerId == freelancerId).ToListAsync();
        }

        //public async Task<IEnumerable<Payment>> GetPaymentsByClientIdAsync(int clientId)
        //{
        //    return await _db.payments.Where(p => p.ClientId == clientId).ToListAsync();
        //}
    }
}
