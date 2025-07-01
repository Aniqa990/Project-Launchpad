using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.Functions.Worker;
using ProjectLaunchpad.Models.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using ProjectLaunchpad.Services;


namespace ProjectLaunchpad.Functions
{
    public class AuthFunctions
    {
        private readonly AuthService _auth;

        public AuthFunctions(AuthService auth)
        {
            _auth = auth;
        }

        [Function("Register")]
        public async Task<HttpResponseData> Register(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/register")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<UserRegisterDTO>();
            var token = await _auth.RegisterAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { token });
            return response;
        }

        [Function("Login")]
        public async Task<HttpResponseData> Login(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")] HttpRequestData req)
        {
            var dto = await req.ReadFromJsonAsync<UserLoginDTO>();
            var token = await _auth.LoginAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { token });
            return response;
        }
    }
}
