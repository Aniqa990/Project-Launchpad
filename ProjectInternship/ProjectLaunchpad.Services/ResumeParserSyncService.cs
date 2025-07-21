using MySql.Data.MySqlClient;
using ProjectLaunchpad.Models;
using ProjectLaunchpad.Models.Models;
using ProjectLaunchpad.Models.Models.DTOs;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerDTO;
using ProjectLaunchpad.Models.Models.DTOs.FreelancerProfile;
using ProjectLaunchpad.Repositories.Repositories.IRepositories;
using ProjectLaunchpad.Utility;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectLaunchpad.Services
{
    public class ResumeParserSyncService
    {
        private readonly string _mysqlConnStr;
        private readonly IUnitOfWork _unitOfWork;

        public ResumeParserSyncService(string mysqlConnStr, IUnitOfWork unitOfWork)
        {
            _mysqlConnStr = mysqlConnStr;
            _unitOfWork = unitOfWork;
        }

        public async Task<ProfileSetupDTO> GetProfileSetupDataAsync(string email)
        {
            using var connection = new MySqlConnection(_mysqlConnStr);
            await connection.OpenAsync();

            Console.WriteLine($"Looking for freelancer with email: {email}");

            // Get freelancer by email
            var freelancer = await GetFreelancerByEmailAsync(connection, email);
            if (freelancer == null)
            {
                Console.WriteLine($"No freelancer found with email: {email}");
                return new ProfileSetupDTO();
            }

            Console.WriteLine($"Found freelancer with ID: {freelancer.Id}");

            var freelancerId = freelancer.Id;
            var summary = freelancer.Summary;

            // Get skills, projects, and experience
            var skills = await GetSkillsAsync(connection, freelancerId);
            var projects = await GetProjectsAsync(connection, freelancerId);
            var experience = await GetExperienceAsync(connection, freelancerId);

            Console.WriteLine($"Retrieved - Skills: {skills.Count}, Projects: {projects.Count}, Experience: {experience.Count}");

            return new ProfileSetupDTO
            {
                Summary = summary ?? string.Empty,
                Skills = skills,
                Projects = projects,
                Experience = experience
            };
        }

        public async Task SaveProfileSetupDataAsync(string email, ProfileSetupDTO dto, FreelancerWithUserDTO profileDto)
        {
            using var connection = new MySqlConnection(_mysqlConnStr);
            await connection.OpenAsync();

            // Get freelancer in resume_parser (other database that stores parsed resume)
            var freelancerId = await GetFreelancerAsync(connection, email, profileDto);

            // Update summary in resume_parser
            await UpdateFreelancerSummaryAsync(connection, freelancerId, dto.Summary);

            // Update skills, projects, and experience in resume_parser
            await UpdateSkillsAsync(connection, freelancerId, dto.Skills);
            await UpdateProjectsAsync(connection, freelancerId, dto.Projects);
            await UpdateExperienceAsync(connection, freelancerId, dto.Experience);

            // Save to your own database (.net)
            await SaveToOwnDatabaseAsync(profileDto, dto);
        }

        private async Task<FreelancerData> GetFreelancerByEmailAsync(MySqlConnection connection, string email)
        {
            Console.WriteLine($"Executing query: SELECT id, summary FROM freelancers WHERE email = '{email}'");

            using var command = new MySqlCommand(
                "SELECT id, summary FROM freelancers WHERE email = @email", connection);
            command.Parameters.AddWithValue("@email", email);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var id = reader.GetInt32("id");
                var summary = reader.IsDBNull("summary") ? null : reader.GetString("summary");
                Console.WriteLine($"Found freelancer - ID: {id}, Summary: {summary}");

                return new FreelancerData
                {
                    Id = id,
                    Summary = summary
                };
            }

            Console.WriteLine("No freelancer found in database");
            return null;
        }

        public async Task DeleteProfileSetupDataAsync(string email)
        {
            using var connection = new MySqlConnection(_mysqlConnStr);
            await connection.OpenAsync();

            // Get freelancer id by email
            int freelancerId = 0;
            using (var cmd = new MySqlCommand("SELECT id FROM freelancers WHERE email = @Email", connection))
            {
                cmd.Parameters.AddWithValue("@Email", email);
                var result = await cmd.ExecuteScalarAsync();
                if (result != null)
                    freelancerId = Convert.ToInt32(result);
            }

            if (freelancerId == 0)
                return; // Not found, nothing to delete

            // Delete from experience, projects, skills, then freelancer
            var tables = new[] { "experience", "projects", "skills" };
            foreach (var table in tables)
            {
                using var cmd = new MySqlCommand($"DELETE FROM {table} WHERE freelancer_id = @FreelancerId", connection);
                cmd.Parameters.AddWithValue("@FreelancerId", freelancerId);
                await cmd.ExecuteNonQueryAsync();
            }

            using (var cmd = new MySqlCommand("DELETE FROM freelancers WHERE id = @FreelancerId", connection))
            {
                cmd.Parameters.AddWithValue("@FreelancerId", freelancerId);
                await cmd.ExecuteNonQueryAsync();
            }
        }

        private async Task<List<SkillDTO>> GetSkillsAsync(MySqlConnection connection, int freelancerId)
        {
            var skills = new List<SkillDTO>();
            using var command = new MySqlCommand(
                "SELECT id, skill_name, source FROM skills WHERE freelancer_id = @freelancerId", connection);
            command.Parameters.AddWithValue("@freelancerId", freelancerId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                skills.Add(new SkillDTO
                {
                    Id = reader.GetInt32("id"),
                    SkillName = reader.GetString("skill_name"),
                    Source = reader.GetString("source")
                });
            }
            return skills;
        }

        private async Task<List<ResumeProjectDTO>> GetProjectsAsync(MySqlConnection connection, int freelancerId)
        {
            var projects = new List<ResumeProjectDTO>();
            using var command = new MySqlCommand(
                "SELECT id, title, description, source FROM projects WHERE freelancer_id = @freelancerId", connection);
            command.Parameters.AddWithValue("@freelancerId", freelancerId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                projects.Add(new ResumeProjectDTO
                {
                    Id = reader.GetInt32("id"),
                    Title = reader.GetString("title"),
                    Description = reader.IsDBNull("description") ? string.Empty : reader.GetString("description"),
                    Source = reader.GetString("source")
                });
            }
            return projects;
        }

        private async Task<List<ExperienceDTO>> GetExperienceAsync(MySqlConnection connection, int freelancerId)
        {
            var experience = new List<ExperienceDTO>();
            using var command = new MySqlCommand(
                @"SELECT id, title, company, startDate, endDate, description, source 
                  FROM experience WHERE freelancer_id = @freelancerId", connection);
            command.Parameters.AddWithValue("@freelancerId", freelancerId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                experience.Add(new ExperienceDTO
                {
                    Id = reader.GetInt32("id"),
                    Title = reader.GetString("title"),
                    Company = reader.GetString("company"),
                    StartDate = reader.IsDBNull("startDate") ? string.Empty : reader.GetString("startDate"),
                    EndDate = reader.IsDBNull("endDate") ? string.Empty : reader.GetString("endDate"),
                    Description = reader.IsDBNull("description") ? string.Empty : reader.GetString("description"),
                    Source = reader.GetString("source")
                });
            }
            return experience;
        }

        private async Task<int> GetFreelancerAsync(MySqlConnection connection, string email, FreelancerWithUserDTO profileDto)
        {
            // Check if freelancer exists
            using var checkCommand = new MySqlCommand(
                "SELECT id FROM freelancers WHERE email = @email", connection);
            checkCommand.Parameters.AddWithValue("@email", email);

            var result = await checkCommand.ExecuteScalarAsync();
            if (result != null)
            {
                return Convert.ToInt32(result);
            }
            return 0;

            //// Create new freelancer using User object properties
            //var fullName = $"{profileDto.User?.FirstName ?? ""} {profileDto.User?.LastName ?? ""}".Trim();
            //using var insertCommand = new MySqlCommand(
            //    @"INSERT INTO freelancers (name, email, phone, summary) 
            //      VALUES (@name, @email, @phone, @summary)", connection);
            //insertCommand.Parameters.AddWithValue("@name", fullName);
            //insertCommand.Parameters.AddWithValue("@email", email);
            //insertCommand.Parameters.AddWithValue("@phone", profileDto.User?.PhoneNo ?? "");
            //insertCommand.Parameters.AddWithValue("@summary", profileDto.Summary ?? "");

            //await insertCommand.ExecuteNonQueryAsync();
            //return (int)insertCommand.LastInsertedId;
        }

        private async Task UpdateFreelancerSummaryAsync(MySqlConnection connection, int freelancerId, string summary)
        {
            using var command = new MySqlCommand(
                "UPDATE freelancers SET summary = @summary WHERE id = @freelancerId", connection);
            command.Parameters.AddWithValue("@summary", summary);
            command.Parameters.AddWithValue("@freelancerId", freelancerId);
            await command.ExecuteNonQueryAsync();
        }

        private async Task UpdateSkillsAsync(MySqlConnection connection, int freelancerId, List<SkillDTO> skills)
        {
            // Delete existing skills
            using var deleteCommand = new MySqlCommand(
                "DELETE FROM skills WHERE freelancer_id = @freelancerId", connection);
            deleteCommand.Parameters.AddWithValue("@freelancerId", freelancerId);
            await deleteCommand.ExecuteNonQueryAsync();

            // Insert new skills
            if (skills.Any())
            {
                using var insertCommand = new MySqlCommand(
                    "INSERT INTO skills (freelancer_id, skill_name, source) VALUES (@freelancerId, @skillName, @source)", connection);

                foreach (var skill in skills)
                {
                    insertCommand.Parameters.Clear();
                    insertCommand.Parameters.AddWithValue("@freelancerId", freelancerId);
                    insertCommand.Parameters.AddWithValue("@skillName", skill.SkillName);
                    insertCommand.Parameters.AddWithValue("@source", skill.Source);
                    await insertCommand.ExecuteNonQueryAsync();
                }
            }
        }

        private async Task UpdateProjectsAsync(MySqlConnection connection, int freelancerId, List<ResumeProjectDTO> projects)
        {
            // Delete existing projects
            using var deleteCommand = new MySqlCommand(
                "DELETE FROM projects WHERE freelancer_id = @freelancerId", connection);
            deleteCommand.Parameters.AddWithValue("@freelancerId", freelancerId);
            await deleteCommand.ExecuteNonQueryAsync();

            // Insert new projects
            if (projects.Any())
            {
                using var insertCommand = new MySqlCommand(
                    "INSERT INTO projects (freelancer_id, title, description, source) VALUES (@freelancerId, @title, @description, @source)", connection);

                foreach (var project in projects)
                {
                    insertCommand.Parameters.Clear();
                    insertCommand.Parameters.AddWithValue("@freelancerId", freelancerId);
                    insertCommand.Parameters.AddWithValue("@title", project.Title);
                    insertCommand.Parameters.AddWithValue("@description", project.Description);
                    insertCommand.Parameters.AddWithValue("@source", project.Source);
                    await insertCommand.ExecuteNonQueryAsync();
                }
            }
        }

        private async Task UpdateExperienceAsync(MySqlConnection connection, int freelancerId, List<ExperienceDTO> experience)
        {
            // Delete existing experience
            using var deleteCommand = new MySqlCommand(
                "DELETE FROM experience WHERE freelancer_id = @freelancerId", connection);
            deleteCommand.Parameters.AddWithValue("@freelancerId", freelancerId);
            await deleteCommand.ExecuteNonQueryAsync();

            // Insert new experience
            if (experience.Any())
            {
                using var insertCommand = new MySqlCommand(
                    "INSERT INTO experience (freelancer_id, title, company, startDate, endDate, description, source) VALUES (@freelancerId, @title, @company, @startDate, @endDate, @description, @source)", connection);

                foreach (var exp in experience)
                {
                    insertCommand.Parameters.Clear();
                    insertCommand.Parameters.AddWithValue("@freelancerId", freelancerId);
                    insertCommand.Parameters.AddWithValue("@title", exp.Title);
                    insertCommand.Parameters.AddWithValue("@company", exp.Company);
                    insertCommand.Parameters.AddWithValue("@startDate", exp.StartDate);
                    insertCommand.Parameters.AddWithValue("@endDate", exp.EndDate);
                    insertCommand.Parameters.AddWithValue("@description", exp.Description);
                    insertCommand.Parameters.AddWithValue("@source", exp.Source);
                    await insertCommand.ExecuteNonQueryAsync();
                }
            }
        }

        private async Task SaveToOwnDatabaseAsync(FreelancerWithUserDTO profileDto, ProfileSetupDTO setupDto)
        {
            // Convert arrays to JSON strings for your database
            var skillsJson = System.Text.Json.JsonSerializer.Serialize(setupDto.Skills);
            var projectsJson = System.Text.Json.JsonSerializer.Serialize(setupDto.Projects);
            var experienceJson = System.Text.Json.JsonSerializer.Serialize(setupDto.Experience);

            // Update the profileDto with JSON strings
            profileDto.Skills = skillsJson;
            profileDto.Projects = projectsJson;
            profileDto.Experience = experienceJson;
            profileDto.Summary = setupDto.Summary;

            // Save to your own database
            await _unitOfWork.FreelancerProfiles.AddOrUpdateFreelancerProfileAsync(profileDto);
            await _unitOfWork.SaveAsync();
        }

        private class FreelancerData
        {
            public int Id { get; set; }
            public string Summary { get; set; }
        }
    }
}