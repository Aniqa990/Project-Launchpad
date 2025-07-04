using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class FreelancerFunctions
    {
        private readonly IUnitOfWork _unit;

        public FreelancerFunctions(IUnitOfWork unit)
        {
            _unit = unit;
        }

        [Function("AddFreelancerProfile")]
        public async Task<HttpResponseData> AddFreelancerProfile(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "freelancer")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<FreelancerProfileDTO>();
            await _unit.FreelancerProfiles.AddFreelancerProfileAsync(dto);
            await _unit.SaveAsync();
            var res = req.CreateResponse(HttpStatusCode.Created);
            await res.WriteAsJsonAsync(new { message = "Freelancer added" });
            return res;
        }

        [Function("DeleteFreelancerProfile")]
        public async Task<HttpResponseData> DeleteFreelancerProfileAsync(
            [HttpTrigger(AuthorizationLevel.Function, "delete", Route = "freelancer/{id:int}")] HttpRequestData req,
            int id)
        {
            var profile = await _unit.FreelancerProfiles.GetProfileByUserIdAsync(id);
            if (profile is null)
                return req.CreateResponse(HttpStatusCode.NotFound);
            await _unit.FreelancerProfiles.DeleteFreelancerProfileAsync(id);
            await _unit.SaveAsync();
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        [Function("GetFreelancerById")]
        public async Task<HttpResponseData> GetFreelancerById(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "freelancer/{id:int}")] HttpRequestData req,
            int id)
        {
            var profile = await _unit.FreelancerProfiles.GetProfileByUserIdAsync(id);
            if (profile is null)
                return req.CreateResponse(HttpStatusCode.NotFound);
            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteAsJsonAsync(profile);
            return res;
        }

        [Function("GetAllFreelancers")]
        public async Task<HttpResponseData> GetAllFreelancers(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = "freelancers")] HttpRequestData req)
        {
            var profiles = await _unit.FreelancerProfiles.GetAllFreelancerProfilesAsync();
            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteAsJsonAsync(profiles);
            return res;
        }

        [Function("UpdateFreelancerProfile")]
        public async Task<HttpResponseData> Update(
            [HttpTrigger(AuthorizationLevel.Function, "patch", Route = "freelancer/{id}")] HttpRequestData req, int id)
        {
            var dto = await req.ReadFromJsonAsync<FreelancerProfileDTO>();
            var profile = await _unit.FreelancerProfiles.GetProfileByUserIdAsync(id);

            if (profile == null) return req.CreateResponse(HttpStatusCode.NotFound);

            profile.Skills = dto.Skills ?? profile.Skills;
            profile.HourlyRate = dto.HourlyRate ?? profile.HourlyRate;
            profile.AvgRating = dto.AvgRating ?? profile.AvgRating;
            profile.Availability = dto.Availability ?? profile.Availability;
            profile.WorkingHours = dto.WorkingHours ?? profile.WorkingHours;

            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Freelancer profile updated successfully." });
            return response;
        }
    }

}
