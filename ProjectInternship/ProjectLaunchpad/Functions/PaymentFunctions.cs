using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.PaymentDTO;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class PaymentFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public PaymentFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("GetAllPayments")]
        public async Task<HttpResponseData> GetAllPayments(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments")] HttpRequestData req)
        {
            var payments = await _unitOfWork.PaymentRepository.GetAllPaymentsAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(payments);
            return response;
        }

        [Function("GetPaymentById")]
        public async Task<HttpResponseData> GetPaymentById(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments/{id:int}")] HttpRequestData req, int id)
        {
            var payment = await _unitOfWork.PaymentRepository.GetPaymentByIdAsync(id);
            if (payment == null)
            {
                return req.CreateResponse(HttpStatusCode.NotFound);
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(payment);
            return response;
        }

        [Function("GetPaymentsByProjectId")]
        public async Task<HttpResponseData> GetPaymentsByProjectId(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments/project/{projectId:int}")] HttpRequestData req, int projectId)
        {
            var payments = await _unitOfWork.PaymentRepository.GetPaymentsByProjectIdAsync(projectId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(payments);
            return response;
        }

        [Function("GetPaymentsByFreelancerId")]
        public async Task<HttpResponseData> GetPaymentsByFreelancerId(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments/freelancer/{freelancerId:int}")] HttpRequestData req, int freelancerId)
        {
            var payments = await _unitOfWork.PaymentRepository.GetPaymentsByFreelancerIdAsync(freelancerId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(payments);
            return response;
        }


        //[Function("GetPaymentsByClientId")]
        //public async Task<HttpResponseData> GetPaymentsByClientId(
        //    [HttpTrigger(AuthorizationLevel.Function, "get", Route = "payments/client/{clientId:int}")] HttpRequestData req, int clientId)
        //{
        //    var payments = await _unitOfWork.PaymentRepository.GetPaymentsByClientIdAsync(clientId);
        //    var response = req.CreateResponse(HttpStatusCode.OK);
        //    await response.WriteAsJsonAsync(payments);
        //    return response;
        //}

        [Function("AddPayment")]
        public async Task<HttpResponseData> AddPayment(
     [HttpTrigger(AuthorizationLevel.Function, "post", Route = "payments")] HttpRequestData req)
        {
            var paymentDto = await req.ReadFromJsonAsync<CreatePaymentDto>();
            if (paymentDto == null)
            {
                return req.CreateResponse(HttpStatusCode.BadRequest);
            }

            var newPayment = new Payment
            {
                ProjectId = paymentDto.ProjectId,
                FreelancerId = paymentDto.FreelancerId,
                PaymentType = paymentDto.PaymentType,
                MilestoneId = paymentDto.MilestoneId,
                TimesheetId = paymentDto.TimesheetId,
                Amount = paymentDto.Amount,
                PaymentDate = paymentDto.PaymentDate == default ? DateTime.UtcNow : paymentDto.PaymentDate,
                PaymentStatus = string.IsNullOrWhiteSpace(paymentDto.PaymentStatus) ? "Pending" : paymentDto.PaymentStatus,
                TransactionReference = paymentDto.TransactionReference
            };

            await _unitOfWork.PaymentRepository.AddPaymentAsync(newPayment);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(newPayment);
            return response;
        }

    }
}
