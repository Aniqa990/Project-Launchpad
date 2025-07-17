using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLaunchpad.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class addChangesToModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
           

            migrationBuilder.AddColumn<string>(
                name: "ProfilePicture",
                table: "users",
                type: "nvarchar(max)",
                nullable: true);

           

           

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
           

         

           

            

            migrationBuilder.DropColumn(
                name: "ProfilePicture",
                table: "users");

        }
    }
}
