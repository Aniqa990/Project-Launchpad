using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile;
using ProjectLaunchpad.Repositories.Repositories;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Services;
using ProjectLaunchpad.Utility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using static Microsoft.ApplicationInsights.MetricDimensionNames.TelemetryContext;

namespace ProjectLaunchpad.Functions
{
    public class FreelancerFunctions
    {
        private readonly IUnitOfWork _unit;
        private readonly TokenAuthorization _auth;

        public FreelancerFunctions(IUnitOfWork unit, TokenAuthorization auth)
        {
            _unit = unit;
            _auth = auth;
        }

        [Function("UpdateFreelancerProfile")]
        public async Task<HttpResponseData> UpdateFreelancerProfile(
        [HttpTrigger(AuthorizationLevel.Function, "patch", Route = "freelancer/profile/{id:int}")] HttpRequestData req, int id)
        {
            (bool isAuthorized, ClaimsPrincipal? userClaims, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");
            if (!isAuthorized) return unauthorizedResponse!;

            var freelancer = await _unit.FreelancerProfiles.GetProfileByUserIdAsync(id);
            var user_f = await _unit.Users.GetUserByIdAsync(id);
            if (freelancer == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            if (user_f == null)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "User not found" });
                return errorResponse;
            }

            var dto = await req.ReadFromJsonAsync<FreelancerWithUserDTO>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);



            // Only update fields that are present in the DTO
            if (!string.IsNullOrEmpty(dto.Skills)) freelancer.Skills = dto.Skills;
            if (!string.IsNullOrEmpty(dto.Experience)) freelancer.Experience = dto.Experience;
            if (!string.IsNullOrEmpty(dto.Projects)) freelancer.Projects = dto.Projects;
            if (dto.HourlyRate.HasValue) freelancer.HourlyRate = dto.HourlyRate.Value;
            if (!string.IsNullOrEmpty(dto.Availability)) freelancer.Availability = dto.Availability;
            if (!string.IsNullOrEmpty(dto.Summary)) freelancer.Summary = dto.Summary;
            if (!string.IsNullOrEmpty(dto.WorkingHours)) freelancer.WorkingHours = dto.WorkingHours;

            if (!string.IsNullOrEmpty(dto.FirstName)) user_f.FirstName = dto.FirstName;
            if (!string.IsNullOrEmpty(dto.LastName)) user_f.LastName = dto.LastName;
            if (!string.IsNullOrEmpty(dto.Email)) user_f.Email = dto.Email;
            if (!string.IsNullOrEmpty(dto.PhoneNo)) user_f.PhoneNo = dto.PhoneNo;
            if (!string.IsNullOrEmpty(dto.ProfilePicture)) user_f.ProfilePicture = dto.ProfilePicture;

            //check if password provided for update is correct
            if (!string.IsNullOrEmpty(dto.Password) && !string.IsNullOrEmpty(dto.NewPassword))
            {

                if (!ProjectLaunchpad.Utility.PasswordHasher.Verify(dto.Password, user_f.Password))
                {
                    var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                    await errorResponse.WriteAsJsonAsync(new { error = "Current password is incorrect" });
                    return errorResponse;
                }

                // Set new password hash
                dto.Password = ProjectLaunchpad.Utility.PasswordHasher.Hash(dto.NewPassword);
            }

            if (!string.IsNullOrEmpty(dto.Password) && !string.IsNullOrEmpty(dto.NewPassword))
                        {
                            user_f.Password = dto.Password;
                        }

            await _unit.FreelancerProfiles.UpdateFreelancerProfileAsync(freelancer);
            await _unit.Users.UpdateUserAsync(user_f);
            await _unit.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Profile updated successfully" });
            return response;
        }

        [Function("DeleteFreelancerProfile")]
        public async Task<HttpResponseData> DeleteFreelancerProfileAsync(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "freelancer/{id:int}")] HttpRequestData req,
        int id)
            {
                (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");

                if (!isAuthorized)
                    return unauthorizedResponse!;

                var profile = await _unit.FreelancerProfiles.GetProfileByUserIdAsync(id);
                if (profile is null)
                    return req.CreateResponse(HttpStatusCode.NotFound);

                // Get the email before deleting user
                var email = profile.User?.Email;

                
                await _unit.FreelancerProfiles.DeleteFreelancerProfileAsync(id);
                await _unit.Users.DeleteUserAsync(id);
                await _unit.SaveAsync();

                return req.CreateResponse(HttpStatusCode.NoContent);
            }

        [Function("GetFreelancerById")]
        public async Task<HttpResponseData> GetFreelancerById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "freelancer/{id:int}")] HttpRequestData req,
            int id)
        {

            var profile = await _unit.FreelancerProfiles.GetProfileByUserIdAsync(id);
            if (profile is null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var responseDto = new FreelancerWithUserDTO
            {
                Id = profile.Id,
                FirstName = profile.User?.FirstName,
                LastName = profile.User?.LastName,
                Email = profile.User?.Email,
                PhoneNo = profile.User?.PhoneNo,
                Gender = profile.User?.Gender,
                ProfilePicture = profile.User?.ProfilePicture,
                Role = profile.User?.Role,
                Skills = profile.Skills,
                Experience = profile.Experience,
                HourlyRate = profile.HourlyRate,
                AvgRating = profile.AvgRating,
                Availability = profile.Availability,
                WorkingHours = profile.WorkingHours,
                Summary = profile.Summary,
                Projects = profile.Projects
            };


            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteAsJsonAsync(responseDto);
            return res;
        }

        [Function("GetAllFreelancers")]
        public async Task<HttpResponseData> GetAllFreelancers(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "freelancers")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "client");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var profiles = await _unit.FreelancerProfiles.GetAllFreelancerProfilesAsync();
            var res = req.CreateResponse(HttpStatusCode.OK);
            await res.WriteAsJsonAsync(profiles);
            return res;
        }

    }

}
