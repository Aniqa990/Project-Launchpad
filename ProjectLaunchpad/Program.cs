using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProjectLaunchpad.DataAccess.Data;
using ProjectLaunchpad.Repositories.Repositories;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Services;
using ProjectLaunchpad.Utility;
using System.IdentityModel.Tokens.Jwt;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

// Register DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Dependency Injection
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TokenAuthorization>();

builder.Services.AddSingleton(new JwtHelper(builder.Configuration["JwtSecret"]));
builder.Services.AddSingleton<JwtValidator>();

builder.Build().Run();
