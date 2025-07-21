using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Functions
{
    public class AdminProfileFunctions
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly TokenAuthorization _auth;

        public AdminProfileFunctions(IUnitOfWork unitOfWork, TokenAuthorization auth)
        {
            _unitOfWork = unitOfWork;
            _auth = auth;
        }

        [Function("GetAdminProfile")]
        public async Task<HttpResponseData> GetAdminProfile(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "admin/profile/{id:int}")] HttpRequestData req, int id)
        {
            (bool isAuthorized, ClaimsPrincipal? userClaims, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");
            if (!isAuthorized) return unauthorizedResponse!;

            var user = await _unitOfWork.Users.GetUserByIdAsync(id);
            if (user == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var dto = new UserDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNo = user.PhoneNo,
                Role = user.Role,
                Gender = user.Gender,
                ProfilePicture = user.ProfilePicture
            };


            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(dto);
            return response;
        }

        [Function("UpdateAdminProfile")]
        public async Task<HttpResponseData> UpdateAdminProfile(
            [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "admin/profile/{id:int}")] HttpRequestData req, int id)
        {
            (bool isAuthorized, ClaimsPrincipal? userClaims, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");
            if (!isAuthorized) return unauthorizedResponse!;

            var user = await _unitOfWork.Users.GetUserByIdAsync(id);
            if (user == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            var dto = await req.ReadFromJsonAsync<UserDTO>();
            if (dto == null)
                return req.CreateResponse(HttpStatusCode.BadRequest);

            // Only update fields that are present in the DTO
            if (!string.IsNullOrEmpty(dto.FirstName)) user.FirstName = dto.FirstName;
            if (!string.IsNullOrEmpty(dto.LastName)) user.LastName = dto.LastName;
            if (!string.IsNullOrEmpty(dto.PhoneNo)) user.PhoneNo = dto.PhoneNo;
            if (!string.IsNullOrEmpty(dto.Gender)) user.Gender = dto.Gender;
            if (!string.IsNullOrEmpty(dto.ProfilePicture)) user.ProfilePicture = dto.ProfilePicture;

            // Password change logic
            if (!string.IsNullOrEmpty(dto.NewPassword))
            {
                var currentPassword = dto.Password;
                var newPassword = dto.NewPassword;
                if (string.IsNullOrEmpty(currentPassword) || string.IsNullOrEmpty(newPassword))
                {
                    var badReq = req.CreateResponse(HttpStatusCode.BadRequest);
                    await badReq.WriteAsJsonAsync(new { message = "Current and new password required." });
                    return badReq;
                }
                // Verify current password
                if (!ProjectLaunchpad.Utility.PasswordHasher.Verify(currentPassword, user.Password))
                {
                    var badReq = req.CreateResponse(HttpStatusCode.BadRequest);
                    await badReq.WriteAsJsonAsync(new { message = "Current password is incorrect." });
                    return badReq;
                }
                // Hash and set new password
                user.Password = ProjectLaunchpad.Utility.PasswordHasher.Hash(newPassword);
            }

            await _unitOfWork.Users.UpdateUserAsync(user);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Profile updated successfully" });
            return response;
        }

        [Function("DeleteAdminAccount")]
        public async Task<HttpResponseData> DeleteAdminAccount(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "admin/profile/{id}")] HttpRequestData req, int id)
        {
            (bool isAuthorized, ClaimsPrincipal? userClaims, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "admin");
            if (!isAuthorized) return unauthorizedResponse!;

            var user = await _unitOfWork.Users.GetUserByIdAsync(id);
            if (user == null)
                return req.CreateResponse(HttpStatusCode.NotFound);

            await _unitOfWork.Users.DeleteUserAsync(id);
            await _unitOfWork.AdminProfiles.DeleteAdminProfileAsync(id);
            await _unitOfWork.SaveAsync();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { message = "Account deleted" });
            return response;
        }
    }
}