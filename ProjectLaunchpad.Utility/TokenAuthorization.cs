using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker.Http;

namespace ProjectLaunchpad.Utility
{
    public class TokenAuthorization
    {
        private readonly JwtValidator _validator;

        public TokenAuthorization(JwtValidator validator)
        {
            _validator = validator;
        }

        public async Task<(bool IsAuthorized, ClaimsPrincipal? User, HttpResponseData? UnauthorizedResponse)> AuthorizeAsync(
            HttpRequestData req, string requiredRole)
        {
            if (!req.Headers.TryGetValues("Authorization", out var values))
                return (false, null, await CreateUnauthorizedResponse(req, "Missing Authorization header"));

            var bearerToken = values.FirstOrDefault();
            if (bearerToken == null || !bearerToken.StartsWith("Bearer "))
                return (false, null, await CreateUnauthorizedResponse(req, "Invalid token format"));

            var token = bearerToken.Substring("Bearer ".Length).Trim();
            var principal = _validator.ValidateToken(token);
            if (principal == null)
                return (false, null, await CreateUnauthorizedResponse(req, "Token validation failed"));

            var role = principal.FindFirst(ClaimTypes.Role)?.Value;
            if (role != requiredRole)
                return (false, principal, await CreateUnauthorizedResponse(req, "Access denied for this role"));

            return (true, principal, null);
        }

        private async Task<HttpResponseData> CreateUnauthorizedResponse(HttpRequestData req, string message)
        {
            var response = req.CreateResponse(HttpStatusCode.Unauthorized);
            await response.WriteStringAsync($"Unauthorized: {message}");
            return response;
        }
    }
}
