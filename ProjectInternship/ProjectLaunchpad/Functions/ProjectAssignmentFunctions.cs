using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using ProjectLaunchpad.Utility;
using System.Security.Claims;

namespace ProjectLaunchpad.Functions
{
    public class ProjectAssignmentFunctions
    {
        private readonly IUnitOfWork _unit;
        private readonly TokenAuthorization _auth;

        public ProjectAssignmentFunctions(IUnitOfWork unit, TokenAuthorization auth)
        {
            _unit = unit;
            _auth = auth;
        }

        [Function("AssignFreelancersToProject")]
        public async Task<HttpResponseData> AssignFreelancersToProject(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "projects/assign")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var dto = await req.ReadFromJsonAsync<ProjectAssignmentDTO>();

            await _unit.ProjectFreelancers.AssignFreelancersAsync(dto.ProjectId, dto.FreelancerId);
            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Freelancer assigned successfully." });
            return response;
        }

        [Function("GetFreelancersByProject")]
        public async Task<HttpResponseData> GetFreelancersByProject(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "projects/{projectId}/freelancers")] HttpRequestData req,
            int projectId)
        {
            var freelancers = await _unit.ProjectFreelancers.GetFreelancersByProjectAsync(projectId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(freelancers);
            return response;
        }

    //    [Function("GetProjectsByFreelancer")]
    //    public async Task<HttpResponseData> GetProjectsByFreelancer(
    //[HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "freelancer/projects")] HttpRequestData req)
    //    {
    //        (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) =
    //            await _auth.AuthorizeAsync(req, "freelancer");

    //        if (!isAuthorized)
    //            return unauthorizedResponse!;

    //        var freelancerIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    //        if (freelancerIdClaim == null || !int.TryParse(freelancerIdClaim, out int freelancerId))
    //        {
    //            var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
    //            await errorResponse.WriteStringAsync("Invalid freelancer ID from token.");
    //            return errorResponse;
    //        }

    //        var projects = await _unit.ProjectFreelancers.GetProjectsByFreelancerIdAsync(freelancerId);

    //        var projectDtos = projects.Select(p => new ProjectBasicDTO
    //        {
    //            Id = p.Id,
    //            Title = p.ProjectTitle
    //        }).ToList();

    //        var response = req.CreateResponse(HttpStatusCode.OK);
    //        await response.WriteAsJsonAsync(projectDtos);
    //        return response;
    //    }


        [Function("RemoveFreelancerFromProject")]
        public async Task<HttpResponseData> RemoveFreelancerFromProject(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "projects/{projectId}/freelancers/{freelancerId}")] HttpRequestData req,
            int projectId, int freelancerId)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            await _unit.ProjectFreelancers.RemoveFreelancerFromProjectAsync(projectId, freelancerId);
            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Freelancer removed from project." });
            return response;
        }

        [Function("GetAllocatedResources")]
        public async Task<HttpResponseData> GetAllocatedResources(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "platform/allocated-resources")] HttpRequestData req)
        {
            var count = await _unit.ProjectFreelancers.GetAllocatedResourcesAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(count);
            return response;
        }

        [Function("GetUnallocatedResources")]
        public async Task<HttpResponseData> GetUnallocatedResources(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "platform/unallocated-resources")] HttpRequestData req)
        {
            var count = await _unit.ProjectFreelancers.GetUnallocatedResourcesAsync();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(count);
            return response;
        }
    }
}