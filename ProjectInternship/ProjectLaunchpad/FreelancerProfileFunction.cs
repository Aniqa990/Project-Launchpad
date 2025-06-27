using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace ProjectLaunchpad;

public class FreelancerProfileFunction
{
    private readonly ILogger<FreelancerProfileFunction> _logger;

    public FreelancerProfileFunction(ILogger<FreelancerProfileFunction> logger)
    {
        _logger = logger;
    }

    [Function("FreelancerProfileFunction")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req)
    {
        _logger.LogInformation("C# HTTP trigger function processed a request.");
        return new OkObjectResult("Welcome to Azure Functions!");
    }
}