import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

class DatabaseConnection:
    def __init__(self):
        # Convert string values to proper boolean format for SQL Server
        trusted_connection = "yes" if os.getenv('DB_TRUSTED_CONNECTION', 'true').lower() == 'true' else "no"
        trust_server_certificate = "yes" if os.getenv('DB_TRUST_SERVER_CERTIFICATE', 'true').lower() == 'true' else "no"
        
        # Format server name for SQL Server Express
        server_name = os.getenv('DB_SERVER', '').replace('\\\\', '\\')
        
        self.connection_string = (
            f"Driver={{{os.getenv('DB_DRIVER')}}};"
            f"Server={server_name};"
            f"Database={os.getenv('DB_NAME')};"
            f"Trusted_Connection={trusted_connection};"
            f"TrustServerCertificate={trust_server_certificate}"
        )
    
    def get_connection(self):
        try:
            connection = pyodbc.connect(self.connection_string)
            return connection
        except Exception as e:
            print(f"Database connection error: {e}")
            raise e
    
    def create_meeting_summaries_table(self):
        """Create the MeetingSummaries table if it doesn't exist"""
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            
            create_table_query = """
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MeetingSummaries' AND xtype='U')
            CREATE TABLE MeetingSummaries (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                FreelancerId INT NOT NULL,
                ProjectId INT NOT NULL,
                FreelancerName NVARCHAR(255) NOT NULL,
                ProjectName NVARCHAR(255) NOT NULL,
                Summary NVARCHAR(MAX),
                Blocker NVARCHAR(MAX),
                CreatedAt DATETIME2 DEFAULT GETDATE(),
                
                -- Foreign Key Constraints
                CONSTRAINT FK_MeetingSummaries_FreelancerProfiles 
                    FOREIGN KEY (FreelancerId) REFERENCES FreelancerProfiles(Id),
                CONSTRAINT FK_MeetingSummaries_Projects 
                    FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
            )
            """
            
            cursor.execute(create_table_query)
            connection.commit()
            cursor.close()
            connection.close()
            
            print("✅ MeetingSummaries table created successfully")
            
        except Exception as e:
            print(f"❌ Error creating table: {e}")
            raise e 