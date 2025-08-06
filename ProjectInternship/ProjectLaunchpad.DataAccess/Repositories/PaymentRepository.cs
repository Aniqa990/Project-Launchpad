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
    public class PaymentRepository : IPaymentRepository
    {
        private readonly ApplicationDbContext _db;
        public PaymentRepository(ApplicationDbContext db) => _db = db;

        public async Task<Payment> GetPaymentByIdAsync(int id) => await _db.payments.FindAsync(id);
        public async Task<IEnumerable<Payment>> GetAllPaymentsAsync() => await _db.payments.ToListAsync();
        public async Task<IEnumerable<Payment>> GetPaymentsByProjectIdAsync(int projectId) =>
            await _db.payments.Where(p => p.ProjectId == projectId).ToListAsync();
        public async Task<IEnumerable<Payment>> GetPaymentsByFreelancerIdAsync(int freelancerId) =>
            await _db.payments.Where(p => p.FreelancerId == freelancerId).ToListAsync();
        public async Task<IEnumerable<Payment>> GetPaymentsByClientIdAsync(int clientId) =>
            await _db.payments.Where(p => p.ClientId == clientId).ToListAsync();

        public async Task<IEnumerable<Payment>> GetPaymentsByMilestoneIdAsync(int milestoneId) =>
            await _db.payments.Where(p => p.MilestoneId == milestoneId).ToListAsync();

        public async Task<Payment?> GetByTransactionReferenceAsync(string transactionRef) =>
            await _db.payments.FirstOrDefaultAsync(p => p.TransactionReference == transactionRef);
        public async Task AddPaymentAsync(Payment payment) => await _db.payments.AddAsync(payment);
        public async Task UpdateAsync(Payment payment)
        {
            payment.PaymentStatus = "Released";
            _db.payments.Update(payment);
            await Task.CompletedTask;
        }

        public async Task<decimal> GetTotalRevenueAsync()
        {
            var paidPayments = await _db.payments
                .Where(p => p.PaymentStatus == "Paid")
                .ToListAsync();

            var totalAmount = paidPayments.Sum(p => p.Amount);
            return totalAmount * 0.05m; // 5% platform fee
        }

        public async Task DeletePaymentAsync(int id)
        {
            var payment = await _db.payments.FindAsync(id);
            if (payment != null)
            {
                _db.payments.Remove(payment);
                await _db.SaveChangesAsync();
            }
        }

        public async Task DeletePaymentsByFreelancerId(int freelancerId)
        {
            var payments = await _db.payments.Where(p => p.FreelancerId == freelancerId).ToListAsync();
            if (payments.Any())
            {
                _db.payments.RemoveRange(payments);
                await _db.SaveChangesAsync();
            }

        }
    }
}
