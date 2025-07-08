using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class removeTablesfromdb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_taskItems_users_CreatedByUserId",
                table: "taskItems");

            migrationBuilder.DropTable(
                name: "freelancerProfiles");

            migrationBuilder.DropTable(
                name: "projectFreelancers");

            migrationBuilder.DropTable(
                name: "projects");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "logs");

            migrationBuilder.CreateIndex(
                name: "IX_taskItems_AssignedToUserId",
                table: "taskItems",
                column: "AssignedToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_taskItems_users_AssignedToUserId",
                table: "taskItems",
                column: "AssignedToUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_taskItems_users_CreatedByUserId",
                table: "taskItems",
                column: "CreatedByUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_taskItems_users_AssignedToUserId",
                table: "taskItems");

            migrationBuilder.DropForeignKey(
                name: "FK_taskItems_users_CreatedByUserId",
                table: "taskItems");

            migrationBuilder.DropIndex(
                name: "IX_taskItems_AssignedToUserId",
                table: "taskItems");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "logs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "freelancerProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Availability = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvgRating = table.Column<decimal>(type: "decimal(3,1)", precision: 3, scale: 1, nullable: false),
                    FixedRate = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    HourlyRate = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Skills = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WorkingHours = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_freelancerProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_freelancerProfiles_users_Id",
                        column: x => x.Id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Budget = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Deadline = table.Column<DateOnly>(type: "date", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SkillsRequired = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_projects_users_ClientId",
                        column: x => x.ClientId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "projectFreelancers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FreelancerId = table.Column<int>(type: "int", nullable: false),
                    ProjectId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projectFreelancers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_projectFreelancers_projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "projects",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_projectFreelancers_users_FreelancerId",
                        column: x => x.FreelancerId,
                        principalTable: "users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_projectFreelancers_FreelancerId",
                table: "projectFreelancers",
                column: "FreelancerId");

            migrationBuilder.CreateIndex(
                name: "IX_projectFreelancers_ProjectId",
                table: "projectFreelancers",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_projects_ClientId",
                table: "projects",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_taskItems_users_CreatedByUserId",
                table: "taskItems",
                column: "CreatedByUserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
