using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models.DTOs.TaskDTO;
using ProjectLaunchpad.Models.Models.Enums;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using ProjectLaunchpad.Models.Models.DTOs.MilestoneDTO;

namespace ProjectLaunchpad.Functions
{
    public class MilestoneFunctions
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly TokenAuthorization _auth;

        public MilestoneFunctions(IUnitOfWork unitOfWork, TokenAuthorization auth)
        {
            _unitOfWork = unitOfWork;
            _auth = auth;
        }

        [Function("CreateMilestone")]
        public async Task<HttpResponseData> CreateMilestoneAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "milestones")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<CreateMilestoneDto>();

            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var milestone = new Milestone
            {
                Title = dto.Title,
                Description = dto.Description,
                Amount = dto.Amount,
                ProjectId = dto.ProjectId,
                DueDate = dto.DueDate
                
            };

            await _unitOfWork.MilestoneRepository.AddMilestoneAsync(milestone);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(milestone);
            return response;
        }

        [Function("SubmitMilestone")]
        public async Task<HttpResponseData> SubmitMilestoneAsync(
     [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "submitmilestone/{milestoneId:int}")] HttpRequestData req,
     int milestoneId)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var milestone = await _unitOfWork.MilestoneRepository.GetMilestoneByIdAsync(milestoneId);
            if (milestone == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var dto = await req.ReadFromJsonAsync<SubmitMilestoneDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            // ✅ Update existing milestone with submission details
            milestone.SubmissionDate = dto.SubmissionDate;
            milestone.FreelancerComments = dto.FreelancerComments;
            milestone.Status = MilestoneStatus.Completed;

            await _unitOfWork.MilestoneRepository.UpdateMilestoneAsync(milestone);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestone);
            return response;
        }

        [Function("GetMilestoneById")]
        public async Task<HttpResponseData> GetMilestoneByIdAsync(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "milestones/{id:int}")] HttpRequestData req, int id)
        {
            var milestone = await _unitOfWork.MilestoneRepository.GetMilestoneByIdAsync(id);
            if (milestone == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestone);
            return response;
        }

        [Function("GetAllMilestones")]
        public async Task<HttpResponseData> GetAllMilestonesAsync(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "milestones")] HttpRequestData req)
        {
            var milestones = await _unitOfWork.MilestoneRepository.GetAllMilestonesAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestones);
            return response;
        }

        [Function("UpdateMilestone")]
        public async Task<HttpResponseData> UpdateMilestoneAsync(
     [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "updatemilestone/{id:int}")] HttpRequestData req,
     int id)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req,"freelancer");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var milestone = await _unitOfWork.MilestoneRepository.GetMilestoneByIdAsync(id);
            if (milestone == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var updated = await req.ReadFromJsonAsync<Milestone>();
            if (updated == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            // Optional: prevent update if already approved
            if (milestone.IsApproved)
            {
                var forbidden = req.CreateResponse(HttpStatusCode.Forbidden);
                await forbidden.WriteStringAsync("Approved milestones cannot be modified.");
                return forbidden;
            }

            // ✅ Update only editable fields
            milestone.Title = updated.Title;
            milestone.Description = updated.Description;
            milestone.DueDate = updated.DueDate;
            milestone.Amount = updated.Amount;
            milestone.FreelancerComments = updated.FreelancerComments;
            milestone.SubmissionDate = updated.SubmissionDate;
            milestone.Status = updated.Status;

            await _unitOfWork.MilestoneRepository.UpdateMilestoneAsync(milestone);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestone);
            return response;
        }

        [Function("DeleteMilestone")]
        public async Task<HttpResponseData> DeleteMilestoneAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "deletemilestones/{id:int}")] HttpRequestData req, int id)
        {

            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var milestone = await _unitOfWork.MilestoneRepository.GetMilestoneByIdAsync(id);
            if (milestone == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            // Optional: prevent deletion if already approved
            if (milestone.IsApproved)
            {
                var forbidden = req.CreateResponse(HttpStatusCode.Forbidden);
                await forbidden.WriteStringAsync("Approved milestones cannot be deleted.");
                return forbidden;
            }

            await _unitOfWork.MilestoneRepository.DeleteMilestoneAsync(id);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("GetMilestonesByProjectId")]
        public async Task<HttpResponseData> GetMilestonesByProjectIdAsync(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "milestones/project/{projectId:int}")] HttpRequestData req, int projectId)
        {
            var milestones = await _unitOfWork.MilestoneRepository.GetMilestonesByProjectIdAsync(projectId);
            if (milestones == null || !milestones.Any())
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestones);
            return response;
        }

        [Function("GetPendingMilestones")]
        public async Task<HttpResponseData> GetPendingMilestonesAsync(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "milestones/pending")] HttpRequestData req)
        {
            var milestones = await _unitOfWork.MilestoneRepository.GetPendingMilestonesAsync();
            if (milestones == null || !milestones.Any())
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestones);
            return response;
        }

        [Function("GetSubmittedMilestones")]
        public async Task<HttpResponseData> GetSubmittedMilestonesAsync(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "milestones/submitted")] HttpRequestData req)
        {
            var milestones = await _unitOfWork.MilestoneRepository.GetSubmittedMilestonesAsync();
            if (milestones == null || !milestones.Any())
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestones);
            return response;
        }

        [Function("GetUnderReviewMilestonesAsync")]
        public async Task<HttpResponseData> GetUnderReviewMilestonesAsync(
             [HttpTrigger(AuthorizationLevel.Function, "get", Route = "milestones/UnderReview")] HttpRequestData req)
        {
            var milestones = await _unitOfWork.MilestoneRepository.GetUnderReviewMilestonesAsync();
            if (milestones == null || !milestones.Any())
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestones);
            return response;
        }


        [Function("GetMilestonesWithPaymentByHandoverStatus")]
        public async Task<HttpResponseData> GetMilestonesWithPaymentByHandoverStatusAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "platform/milestones/handover/{status}")] HttpRequestData req, string status)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");
            if (!isAuthorized)
                return unauthorizedResponse!;

            var result = await _unitOfWork.MilestoneRepository.GetMilestonesByHandoverStatusAsync(status);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(result);
            return response;
        }

        [Function("UpdateHandoverStatus")]
        public async Task<HttpResponseData> UpdateHandoverStatusAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "platform/handover/{id:int}")] HttpRequestData req, int id)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");
            if (!isAuthorized)
                return unauthorizedResponse!;
            var milestone = await _unitOfWork.MilestoneRepository.GetMilestoneByIdAsync(id);
            if (milestone == null)
                return req.CreateResponse(HttpStatusCode.NotFound);
            var dto = await req.ReadFromJsonAsync<UpdateHandoverStatusDTO>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);
   
            milestone.HandoverStatus = dto.HandoverStatus;
            await _unitOfWork.MilestoneRepository.UpdateMilestoneAsync(milestone);
            await _unitOfWork.SaveAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(milestone);
            return response;
        }


    }
}
