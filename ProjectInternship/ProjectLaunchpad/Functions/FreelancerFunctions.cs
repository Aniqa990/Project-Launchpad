using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile;
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

namespace ProjectLaunchpad.Functions
{
    public class FreelancerFunctions
    {
        private readonly IUnitOfWork _unit;
        private readonly TokenAuthorization _auth;
        private readonly ResumeParserSyncService _resumeParserSyncService;

        public FreelancerFunctions(IUnitOfWork unit, TokenAuthorization auth, ResumeParserSyncService resumeParserSyncService)
        {
            _unit = unit;
            _auth = auth;
            _resumeParserSyncService = resumeParserSyncService;
        }

        [Function("GetProfileSetupData")]
        public async Task<HttpResponseData> GetProfileSetupData(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "freelancer/profile-setup")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var email = user?.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(email))
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "Email not found in token" });
                return errorResponse;
            }

            try
            {
                var profileData = await _resumeParserSyncService.GetProfileSetupDataAsync(email);
                var res = req.CreateResponse(HttpStatusCode.OK);
                await res.WriteAsJsonAsync(profileData);
                return res;
            }
            catch (Exception ex)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteAsJsonAsync(new { error = "Failed to fetch profile setup data", details = ex.Message });
                return errorResponse;
            }
        }

        [Function("AddFreelancerProfile")]
        public async Task<HttpResponseData> SaveProfileSetupData(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "freelancer/profile-setup")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var email = user?.FindFirst(ClaimTypes.Email)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.IsNullOrEmpty(email) || userId == 0)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "User information not found in token" });
                return errorResponse;
            }

            try
            {
                var requestData = await req.ReadFromJsonAsync<ProfileSetupRequestDTO>();
                if (requestData == null)
                {
                    var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                    await errorResponse.WriteAsJsonAsync(new { error = "Invalid request data" });
                    return errorResponse;
                }


                var profileDto = new FreelancerWithUserDTO
                {
                    Id = userId,
                    FirstName = requestData.FirstName,
                    LastName = requestData.LastName,
                    Email = email,
                    PhoneNo = requestData.Phone,
                    Role = "freelancer",
                    HourlyRate = requestData.HourlyRate,
                    Availability = requestData.Availability,
                    WorkingHours = requestData.WorkingHours,
                    Summary = requestData.ProfileData.Summary
                };

                await _resumeParserSyncService.SaveProfileSetupDataAsync(email, requestData.ProfileData, profileDto);

                var res = req.CreateResponse(HttpStatusCode.OK);
                await res.WriteAsJsonAsync(new { message = "Profile setup data saved successfully" });
                return res;
            }
            catch (Exception ex)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteAsJsonAsync(new { error = "Failed to save profile setup data", details = ex.Message });
                return errorResponse;
            }
        }

        [Function("UpdateFreelancerProfile")]
        public async Task<HttpResponseData> UpdateProfileSetupData(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "freelancer/profile-setup")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");

            if (!isAuthorized)
                return unauthorizedResponse!;

            var email = user?.FindFirst(ClaimTypes.Email)?.Value;
            var userId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (string.IsNullOrEmpty(email) || userId == 0)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "User information not found in token" });
                return errorResponse;
            }



            try
            {
                var requestData = await req.ReadFromJsonAsync<ProfileSetupRequestDTO>();
                if (requestData == null)
                {
                    var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                    await errorResponse.WriteAsJsonAsync(new { error = "Invalid request data" });
                    return errorResponse;
                }

                //check if password provided for update is correct
                if (!string.IsNullOrEmpty(requestData.Password) && !string.IsNullOrEmpty(requestData.NewPassword))
                {
                    var freelancer = await _unit.Users.GetUserByIdAsync(userId);
                    if (freelancer == null)
                    {
                        var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                        await errorResponse.WriteAsJsonAsync(new { error = "User not found" });
                        return errorResponse;
                    }

                    if (!ProjectLaunchpad.Utility.PasswordHasher.Verify(requestData.Password, freelancer.Password))
                    {
                        var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                        await errorResponse.WriteAsJsonAsync(new { error = "Current password is incorrect" });
                        return errorResponse;
                    }

                    // Set new password hash
                    requestData.Password = ProjectLaunchpad.Utility.PasswordHasher.Hash(requestData.NewPassword);
                }

                // Create FreelancerProfileDTO from request data
                var profileDto = new FreelancerWithUserDTO
                {
                    Id = userId,
                    FirstName = requestData.FirstName,
                    LastName = requestData.LastName,
                    Email = email,
                    PhoneNo = requestData.Phone,
                    Role = "freelancer",
                    HourlyRate = requestData.HourlyRate,
                    Availability = requestData.Availability,
                    WorkingHours = requestData.WorkingHours,
                    Summary = requestData.ProfileData.Summary,
                    ProfilePicture = requestData.ProfilePicture
                };

                //only add password if it is provided (update password)
                if (!string.IsNullOrEmpty(requestData.Password) && !string.IsNullOrEmpty(requestData.NewPassword))
                {
                    profileDto.Password = requestData.Password;
                }

                await _resumeParserSyncService.SaveProfileSetupDataAsync(email, requestData.ProfileData, profileDto);

                var res = req.CreateResponse(HttpStatusCode.OK);
                await res.WriteAsJsonAsync(new { message = "Profile setup data updated successfully" });
                return res;
            }
            catch (Exception ex)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteAsJsonAsync(new { error = "Failed to update profile setup data", details = ex.Message });
                return errorResponse;
            }
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

                // Delete from resume_parser if email is available
                if (!string.IsNullOrEmpty(email))
                {
                    await _resumeParserSyncService.DeleteProfileSetupDataAsync(email);
                }

                return req.CreateResponse(HttpStatusCode.NoContent);
            }

        [Function("GetFreelancerById")]
        public async Task<HttpResponseData> GetFreelancerById(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "freelancer/{id:int}")] HttpRequestData req,
            int id)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "freelancer");

            if (!isAuthorized)
                return unauthorizedResponse!;

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
