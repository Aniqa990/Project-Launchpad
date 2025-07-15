using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;
using ProjectLaunchpad.Utility;
using System.Security.Claims;
using ProjectLaunchpad.Models.Models.DTOs.ProjectRequestDTO;

namespace ProjectLaunchpad.Functions
{
    public class ProjectRequestFunctions
    {
        private readonly IUnitOfWork _unit;
        private readonly TokenAuthorization _auth;

        public ProjectRequestFunctions(IUnitOfWork unit, TokenAuthorization auth)
        {
            _unit = unit;
            _auth = auth;
        }

        [Function("CreateProjectRequest")]
        public async Task<HttpResponseData> CreateProjectRequest(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects/requests")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "Client");
            if (!isAuthorized)
                return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<ProjectRequestCreateDTO>();


            await _unit.ProjectRequests.CreateRequestAsync(dto);
            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new { message = "Project request created successfully." });
            return response;
        }

        [Function("GetProjectRequests")]
        public async Task<HttpResponseData> GetProjectRequests(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "requests/{freelancerId}")] HttpRequestData req, int freelancerId)
        {
            var requests = await _unit.ProjectRequests.GetRequestsByFreelancerAsync(freelancerId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(requests);
            return response;
        }

        [Function("UpdateRequestStatus")]
        public async Task<HttpResponseData> UpdateRequestStatus(
            [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "requests/{freelancerId}/{projectId}")] HttpRequestData req, int freelancerId, int projectId)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "Freelancer");
            if (!isAuthorized)
                return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<ProjectRequestResponseDTO>();
            var request = await _unit.ProjectRequests.GetRequestByFreelancerAndProjectAsync(freelancerId, projectId);

            if (request == null) return req.CreateResponse(HttpStatusCode.NotFound);

            request.Status = dto.Status ?? request.Status;

            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Request status updated successfully." });
            return response;
        }
    }
}
