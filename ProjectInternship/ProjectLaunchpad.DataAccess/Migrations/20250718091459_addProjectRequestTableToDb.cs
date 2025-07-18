using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addProjectRequestTableToDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
       name: "Feedbacks",
       columns: table => new
       {
           ProjectId = table.Column<int>(type: "int", nullable: false),
           FreelancerId = table.Column<int>(type: "int", nullable: false),
           Review = table.Column<string>(type: "nvarchar(max)", nullable: false),
           Rating = table.Column<decimal>(type: "decimal(3,1)", precision: 3, scale: 1, nullable: false),
           CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
       },
       constraints: table =>
       {
           table.PrimaryKey("PK_Feedbacks", x => new { x.ProjectId, x.FreelancerId });
           table.ForeignKey(
               name: "FK_Feedbacks_freelancerProfiles_FreelancerId",
               column: x => x.FreelancerId,
               principalTable: "freelancerProfiles",
               principalColumn: "Id",
               onDelete: ReferentialAction.Restrict);
           table.ForeignKey(
               name: "FK_Feedbacks_projects_ProjectId",
               column: x => x.ProjectId,
               principalTable: "projects",
               principalColumn: "Id",
               onDelete: ReferentialAction.Cascade);
       });

            migrationBuilder.CreateTable(
                name: "projectRequests",
                columns: table => new
                {
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    FreelancerId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projectRequests", x => new { x.ProjectId, x.FreelancerId });
                    table.ForeignKey(
                        name: "FK_projectRequests_freelancerProfiles_FreelancerId",
                        column: x => x.FreelancerId,
                        principalTable: "freelancerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_projectRequests_projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TimeSheets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    FreelancerId = table.Column<int>(type: "int", nullable: false),
                    DateOfWork = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    WorkDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HourlyRate = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReviewerComments = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimeSheets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TimeSheets_freelancerProfiles_FreelancerId",
                        column: x => x.FreelancerId,
                        principalTable: "freelancerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TimeSheets_projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_FreelancerId",
                table: "Feedbacks",
                column: "FreelancerId");

            migrationBuilder.CreateIndex(
                name: "IX_projectRequests_FreelancerId",
                table: "projectRequests",
                column: "FreelancerId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeSheets_FreelancerId",
                table: "TimeSheets",
                column: "FreelancerId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeSheets_ProjectId",
                table: "TimeSheets",
                column: "ProjectId");

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.DropTable(
       name: "Feedbacks");

            migrationBuilder.DropTable(
                name: "projectRequests");

            migrationBuilder.DropTable(
                name: "TimeSheets");
        }
    }
}
