using ProjectLaunchpad.Models.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.DataAccess.Repositories.IRepositories
{
    public interface IPaymentRepository
    {
        Task<Payment> GetPaymentByIdAsync(int id);
        Task<IEnumerable<Payment>> GetAllPaymentsAsync();
        Task AddPaymentAsync(Payment payment);
        Task<IEnumerable<Payment>> GetPaymentsByProjectIdAsync(int projectId);
        Task<IEnumerable<Payment>> GetPaymentsByFreelancerIdAsync(int freelancerId);

        //Task<IEnumerable<Payment>> GetPaymentsByClientIdAsync(int clientId);

    }
}
