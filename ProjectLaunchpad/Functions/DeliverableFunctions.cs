using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs.DeliverableDTO;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class DeliverableFunctions
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeliverableFunctions(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [Function("CreateDeliverable")]
        public async Task<HttpResponseData> CreateDeliverable(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = "deliverables")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<CreateDeliverableDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            var deliverable = new Deliverables
            {
                uploadFiles = dto.uploadFiles!,
                projectId = dto.projectId,
                comment = dto.comment!,
                Status = dto.status ?? "Pending"
            };

            await _unitOfWork.deliverableRepository.AddAsync(deliverable);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(deliverable);
            return response;
        }

        [Function("GetAllDeliverables")]
        public async Task<HttpResponseData> GetAllDeliverables(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "deliverables")] HttpRequestData req)
        {
            var result = await _unitOfWork.deliverableRepository.GetAllAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(result);
            return response;
        }

        [Function("GetDeliverableById")]
        public async Task<HttpResponseData> GetDeliverableById(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "deliverables/{id:int}")] HttpRequestData req, int id)
        {
            var deliverable = await _unitOfWork.deliverableRepository.GetByIdAsync(id);
            if (deliverable == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(deliverable);
            return response;
        }

        [Function("UpdateDeliverable")]
        public async Task<HttpResponseData> UpdateDeliverable(
            [HttpTrigger(AuthorizationLevel.Function, "put", Route = "deliverables/{id:int}")] HttpRequestData req, int id)
        {
            var existing = await _unitOfWork.deliverableRepository.GetByIdAsync(id);
            if (existing == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var dto = await req.ReadFromJsonAsync<CreateDeliverableDto>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            existing.uploadFiles = dto.uploadFiles!;
            existing.projectId = dto.projectId;
            existing.comment = dto.comment!;
            existing.Status = dto.status ?? existing.Status;

            _unitOfWork.deliverableRepository.Update(existing);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(existing);
            return response;
        }

        [Function("DeleteDeliverable")]
        public async Task<HttpResponseData> DeleteDeliverable(
            [HttpTrigger(AuthorizationLevel.Function, "delete", Route = "deliverables/{id:int}")] HttpRequestData req, int id)
        {
            var deliverable = await _unitOfWork.deliverableRepository.GetByIdAsync(id);
            if (deliverable == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            _unitOfWork.deliverableRepository.Delete(deliverable);
            await _unitOfWork.SaveAsync();

            return req.CreateResponse(HttpStatusCode.NoContent);
        }
    }
}
