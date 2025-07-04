using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class updateprofiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_projectFreelancers_projects_ProjectId",
                table: "projectFreelancers");

            migrationBuilder.DropColumn(
                name: "FixedRate",
                table: "freelancerProfiles");

            migrationBuilder.AlterColumn<decimal>(
                name: "HourlyRate",
                table: "freelancerProfiles",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Experience",
                table: "freelancerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Summary",
                table: "freelancerProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_projectFreelancers_projects_ProjectId",
                table: "projectFreelancers",
                column: "ProjectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_projectFreelancers_projects_ProjectId",
                table: "projectFreelancers");

            migrationBuilder.DropColumn(
                name: "Experience",
                table: "freelancerProfiles");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "freelancerProfiles");

            migrationBuilder.AlterColumn<decimal>(
                name: "HourlyRate",
                table: "freelancerProfiles",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AddColumn<decimal>(
                name: "FixedRate",
                table: "freelancerProfiles",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_projectFreelancers_projects_ProjectId",
                table: "projectFreelancers",
                column: "ProjectId",
                principalTable: "projects",
                principalColumn: "Id");
        }
    }
}
