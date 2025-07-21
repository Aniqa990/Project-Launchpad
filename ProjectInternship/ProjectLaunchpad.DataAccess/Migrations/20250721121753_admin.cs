using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class admin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Duration",
                table: "experiences",
                newName: "StartDate");

            migrationBuilder.AddColumn<string>(
                name: "EndDate",
                table: "experiences",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "adminProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_adminProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_adminProfiles_users_Id",
                        column: x => x.Id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "adminProfiles");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "experiences");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "experiences",
                newName: "Duration");
        }
    }
}
