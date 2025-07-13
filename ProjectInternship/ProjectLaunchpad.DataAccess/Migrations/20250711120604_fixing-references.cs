using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class fixingreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_logs_users_FreelancerId",
                table: "logs");

            migrationBuilder.DropColumn(
                name: "FreelancerName",
                table: "TimeSheets");

            migrationBuilder.DropColumn(
                name: "ProjectName",
                table: "TimeSheets");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "payments");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "projects",
                newName: "RequiredSkills");

            migrationBuilder.RenameColumn(
                name: "SkillsRequired",
                table: "projects",
                newName: "ProjectTitle");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "projects",
                newName: "CategoryOrDomain");

            migrationBuilder.AddColumn<int>(
                name: "FreelancerId",
                table: "TimeSheets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "TimeSheets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "projects",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Deadline",
                table: "projects",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date");

            migrationBuilder.AddColumn<string>(
                name: "AttachedDocumentPath",
                table: "projects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumberOfFreelancers",
                table: "projects",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PaymentType",
                table: "projects",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TimeSheets_FreelancerId",
                table: "TimeSheets",
                column: "FreelancerId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeSheets_ProjectId",
                table: "TimeSheets",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_FreelancerId",
                table: "payments",
                column: "FreelancerId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_ProjectId",
                table: "payments",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_deliverables_projectId",
                table: "deliverables",
                column: "projectId");

            migrationBuilder.AddForeignKey(
                name: "FK_deliverables_projects_projectId",
                table: "deliverables",
                column: "projectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_logs_freelancerProfiles_FreelancerId",
                table: "logs",
                column: "FreelancerId",
                principalTable: "freelancerProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_payments_freelancerProfiles_FreelancerId",
                table: "payments",
                column: "FreelancerId",
                principalTable: "freelancerProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_payments_projects_ProjectId",
                table: "payments",
                column: "ProjectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSheets_freelancerProfiles_FreelancerId",
                table: "TimeSheets",
                column: "FreelancerId",
                principalTable: "freelancerProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSheets_projects_ProjectId",
                table: "TimeSheets",
                column: "ProjectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_deliverables_projects_projectId",
                table: "deliverables");

            migrationBuilder.DropForeignKey(
                name: "FK_logs_freelancerProfiles_FreelancerId",
                table: "logs");

            migrationBuilder.DropForeignKey(
                name: "FK_payments_freelancerProfiles_FreelancerId",
                table: "payments");

            migrationBuilder.DropForeignKey(
                name: "FK_payments_projects_ProjectId",
                table: "payments");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeSheets_freelancerProfiles_FreelancerId",
                table: "TimeSheets");

            migrationBuilder.DropForeignKey(
                name: "FK_TimeSheets_projects_ProjectId",
                table: "TimeSheets");

            migrationBuilder.DropIndex(
                name: "IX_TimeSheets_FreelancerId",
                table: "TimeSheets");

            migrationBuilder.DropIndex(
                name: "IX_TimeSheets_ProjectId",
                table: "TimeSheets");

            migrationBuilder.DropIndex(
                name: "IX_payments_FreelancerId",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_payments_ProjectId",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_deliverables_projectId",
                table: "deliverables");

            migrationBuilder.DropColumn(
                name: "FreelancerId",
                table: "TimeSheets");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "TimeSheets");

            migrationBuilder.DropColumn(
                name: "AttachedDocumentPath",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "NumberOfFreelancers",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "PaymentType",
                table: "projects");

            migrationBuilder.RenameColumn(
                name: "RequiredSkills",
                table: "projects",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "ProjectTitle",
                table: "projects",
                newName: "SkillsRequired");

            migrationBuilder.RenameColumn(
                name: "CategoryOrDomain",
                table: "projects",
                newName: "Category");

            migrationBuilder.AddColumn<string>(
                name: "FreelancerName",
                table: "TimeSheets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectName",
                table: "TimeSheets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "projects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateOnly>(
                name: "Deadline",
                table: "projects",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<int>(
                name: "ClientId",
                table: "payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_logs_users_FreelancerId",
                table: "logs",
                column: "FreelancerId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
