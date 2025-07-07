using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
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
    public class ProtectedFunction
    {
        private readonly TokenAuthorization _auth;

        public ProtectedFunction(TokenAuthorization auth)
        {
            _auth = auth;
        }

        [Function("GetClientDashboard")]
        public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "client/dashboard")] HttpRequestData req)
        {
            (bool isAuthorized, ClaimsPrincipal? user, HttpResponseData? unauthorizedResponse) = await _auth.AuthorizeAsync(req, "Client");


            if (!isAuthorized)
                return unauthorizedResponse!;

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync($"Welcome, Client {user!.Identity!.Name}!");
            return response;
        }
    }
}
