using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class DeliverablesFunctions
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly TokenAuthorization _auth;

        public DeliverablesFunctions(IUnitOfWork unitOfWork, TokenAuthorization auth)
        {
            _unitOfWork = unitOfWork;
            _auth = auth;
        }

        [Function("CreateDeliverable")]
        public async Task<HttpResponseData> CreateDeliverableAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "deliverables")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");
            if (!isAuthorized) return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<CreateDeliverableDto>();
            if (dto == null) return req.CreateResponse(HttpStatusCode.BadRequest);

            var deliverable = new Deliverables
            {
                uploadFiles = dto.UploadFiles,
                MilestoneId = dto.MilestoneId,
                comment = dto.Comment,
                Status = dto.Status
            };

            await _unitOfWork.DeliverablesRepository.AddAsync(deliverable);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(deliverable);
            return response;
        }

        [Function("GetDeliverablesByMilestoneId")]
        public async Task<HttpResponseData> GetDeliverablesByMilestoneIdAsync(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "deliverables/milestone/{milestoneId:int}")] HttpRequestData req, int milestoneId)
        {
            var deliverables = await _unitOfWork.DeliverablesRepository.GetByMilestoneIdAsync(milestoneId);

            if (!deliverables.Any())
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(deliverables);
            return response;
        }
    }

}
