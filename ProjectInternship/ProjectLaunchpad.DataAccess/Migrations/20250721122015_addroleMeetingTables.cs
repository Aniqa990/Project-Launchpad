using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addroleMeetingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "MeetingParticipants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "role",
                table: "MeetingParticipants");
        }
    }
}
