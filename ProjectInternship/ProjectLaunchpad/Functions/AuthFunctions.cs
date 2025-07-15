using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.Functions.Worker;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using ProjectLaunchpad.Services;
using ProjectLaunchpad.Models.Models.DTOs.AuthenticationDTO;
using ProjectLaunchpad.Utility;
using System.Security.Claims;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;

namespace ProjectLaunchpad.Functions
{
    public class AuthFunctions
    {
        private readonly AuthService _auth;
        private readonly TokenAuthorization _tokenAuth;
        private readonly JwtValidator _jwtValidator;
        private readonly IUnitOfWork _unitOfWork;

        public AuthFunctions(AuthService auth, TokenAuthorization tokenAuth, JwtValidator jwtValidator, IUnitOfWork unitOfWork)
        {
            _auth = auth;
            _tokenAuth = tokenAuth;
            _jwtValidator = jwtValidator;
            _unitOfWork = unitOfWork;
        }

        [Function("Register")]
        public async Task<HttpResponseData> Register(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/register")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<UserRegisterDTO>();
            var (token, user) = await _auth.RegisterAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                token = token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    role = user.Role
                }
            });
            return response;
        }

        [Function("Login")]
        public async Task<HttpResponseData> Login(
     [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<UserLoginDTO>();
            var (token, user) = await _auth.LoginAsync(dto); // Now getting both

            if (user.Role == "Client")
            {
                _unitOfWork.ClientProfiles.InsertClientProfile(user.Id);
                await _unitOfWork.SaveAsync();
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                token = token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    role = user.Role
                }
            });

            return response;
        }

        [Function("ValidateToken")]
        public async Task<HttpResponseData> ValidateToken(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/validate")] HttpRequestData req)
        {
            try
            {
                if (!req.Headers.TryGetValues("Authorization", out var values))
                {
                    var response = req.CreateResponse(HttpStatusCode.Unauthorized);
                    await response.WriteAsJsonAsync(new { valid = false, message = "Missing Authorization header" });
                    return response;
                }

                var bearerToken = values.FirstOrDefault();
                if (bearerToken == null || !bearerToken.StartsWith("Bearer "))
                {
                    var response = req.CreateResponse(HttpStatusCode.Unauthorized);
                    await response.WriteAsJsonAsync(new { valid = false, message = "Invalid token format" });
                    return response;
                }

                var token = bearerToken.Substring("Bearer ".Length).Trim();
                
                var principal = _jwtValidator.ValidateToken(token);
                
                if (principal == null)
                {
                    var response = req.CreateResponse(HttpStatusCode.Unauthorized);
                    await response.WriteAsJsonAsync(new { valid = false, message = "Token validation failed" });
                    return response;
                }
                
                // Get user ID from token
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    var response = req.CreateResponse(HttpStatusCode.Unauthorized);
                    await response.WriteAsJsonAsync(new { valid = false, message = "Invalid user ID in token" });
                    return response;
                }

                // Get user from database
                var user = await _unitOfWork.Users.GetUserByIdAsync(userId);
                if (user == null)
                {
                    var response = req.CreateResponse(HttpStatusCode.Unauthorized);
                    await response.WriteAsJsonAsync(new { valid = false, message = "User not found" });
                    return response;
                }
                var successResponse = req.CreateResponse(HttpStatusCode.OK);
                await successResponse.WriteAsJsonAsync(new
                {
                    valid = true,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        role = user.Role
                    }
                });
                return successResponse;
            }
            catch (Exception ex)
            {
                var response = req.CreateResponse(HttpStatusCode.Unauthorized);
                await response.WriteAsJsonAsync(new { valid = false, message = "Invalid token" });
                return response;
            }
        }
    }
}
