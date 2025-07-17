using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addProjectTableAndRefrence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
               name: "projects",
               columns: table => new
               {
                   Id = table.Column<int>(type: "int", nullable: false)
                       .Annotation("SqlServer:Identity", "1, 1"),
                   ProjectTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                   Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                   PaymentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                   CategoryOrDomain = table.Column<string>(type: "nvarchar(max)", nullable: false),
                   Deadline = table.Column<DateTime>(type: "datetime2", nullable: false),
                   RequiredSkills = table.Column<string>(type: "nvarchar(max)", nullable: false),
                   Budget = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                   NumberOfFreelancers = table.Column<int>(type: "int", nullable: false),
                   Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                   AttachedDocumentPath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                   ClientId = table.Column<int>(type: "int", nullable: false)
               },
               constraints: table =>
               {
                   table.PrimaryKey("PK_projects", x => x.Id);
                   table.ForeignKey(
                       name: "FK_projects_clientProfiles_ClientId",
                       column: x => x.ClientId,
                       principalTable: "clientProfiles",
                       principalColumn: "Id",
                       onDelete: ReferentialAction.Cascade);
               });



            migrationBuilder.AddColumn<int>(
                name: "projectId",
                table: "taskItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
              name: "IX_projects_ClientId",
              table: "projects",
              column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_taskItems_projectId",
                table: "taskItems",
                column: "projectId");

            migrationBuilder.AddForeignKey(
                name: "FK_taskItems_projects_projectId",
                table: "taskItems",
                column: "projectId",
                principalTable: "projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_taskItems_projects_projectId",
                table: "taskItems");

            migrationBuilder.DropIndex(
                name: "IX_taskItems_projectId",
                table: "taskItems");

            migrationBuilder.DropColumn(
                name: "projectId",
                table: "taskItems");


            migrationBuilder.DropTable(
                name: "projects");
        }
    }
}
