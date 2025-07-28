import pyodbc
from dotenv import load_dotenv
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

# Load from .env
load_dotenv()

def get_db_connection():
    """Get SQL Server database connection"""
    # Convert string values to proper boolean format for SQL Server
    trusted_connection = "yes" if os.getenv('DB_TRUSTED_CONNECTION', 'true').lower() == 'true' else "no"
    trust_server_certificate = "yes" if os.getenv('DB_TRUST_SERVER_CERTIFICATE', 'true').lower() == 'true' else "no"
    
    # Format server name for SQL Server Express
    server_name = os.getenv('DB_SERVER', '').replace('\\\\', '\\')
    
    connection_string = (
        f"Driver={{{os.getenv('DB_DRIVER')}}};"
        f"Server={server_name};"
        f"Database={os.getenv('DB_NAME')};"
        f"Trusted_Connection={trusted_connection};"
        f"TrustServerCertificate={trust_server_certificate}"
    )
    
    try:
        connection = pyodbc.connect(connection_string)
        return connection
    except Exception as e:
        print(f"Database connection error: {e}")
        raise e

def store_summary(data):
    """Store meeting summary in SQL Server database"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            INSERT INTO MeetingSummaries 
            (FreelancerId, ProjectId, FreelancerName, ProjectName, Summary, Blocker)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        
        values = (
            data.get("freelancer_id"),
            data.get("project_id"),
            data.get("freelancer_name"),
            data.get("project_name"),
            data.get("summary"),
            data.get("blocker")
        )
        
        cursor.execute(query, values)
        connection.commit()
        print("✅ Summary inserted into SQL Server DB")
        
    except Exception as e:
        print(f"❌ DB Error: {e}")
    finally:
        if 'connection' in locals() and connection:
            cursor.close()
            connection.close()

def fetch_all_summaries():
    """Fetch all meeting summaries from SQL Server"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT Id, FreelancerId, ProjectId, FreelancerName, ProjectName, 
                   Summary, Blocker, CreatedAt
            FROM MeetingSummaries 
            ORDER BY CreatedAt DESC
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        summaries = []
        for row in results:
            summaries.append({
                "id": row[0],
                "freelancer_id": row[1],
                "project_id": row[2],
                "freelancer_name": row[3],
                "project_name": row[4],
                "summary": row[5],
                "blocker": row[6],
                "created_at": row[7]
            })
        
        return summaries
        
    except Exception as e:
        print(f"❌ DB Error: {e}")
        return []
    finally:
        if 'connection' in locals() and connection:
            cursor.close()
            connection.close()

def get_project_by_id(project_id: int) -> Optional[Dict[str, Any]]:
    """Get project details by ID"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT Id, ProjectTitle, Description, RequiredSkills, Budget, Deadline, CategoryOrDomain
            FROM Projects 
            WHERE Id = ?
        """
        
        cursor.execute(query, (project_id,))
        result = cursor.fetchone()
        
        if result:
            return {
                "id": result[0],
                "projectTitle": result[1],
                "description": result[2],
                "requiredSkills": result[3],
                "budget": result[4],
                "deadline": result[5],
                "categoryOrDomain": result[6]
            }
        return None
        
    except Exception as e:
        print(f"Error getting project: {e}")
        return None
    finally:
        if 'connection' in locals() and connection:
            cursor.close()
            connection.close()

def get_freelancer_by_id(freelancer_id: int) -> Optional[Dict[str, Any]]:
    """Get freelancer details by ID"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        query = """
            SELECT u.Id, u.FirstName, u.LastName, u.Email, f.HourlyRate
            FROM Users u
            JOIN FreelancerProfiles f ON u.Id = f.Id
            WHERE u.Id = ?
        """
        
        cursor.execute(query, (freelancer_id,))
        result = cursor.fetchone()
        
        if result:
            return {
                "id": result[0],
                "firstName": result[1],
                "lastName": result[2],
                "email": result[3],
                "hourlyRate": result[4]
            }
        return None
        
    except Exception as e:
        print(f"Error getting freelancer: {e}")
        return None
    finally:
        if 'connection' in locals() and connection:
            cursor.close()
            connection.close()

def get_meeting_summaries_by_user(user_id: int, user_role: str, 
                                 project_ids: Optional[List[int]] = None,
                                 date_from: Optional[str] = None,
                                 date_to: Optional[str] = None) -> Dict[str, Any]:
    """Get meeting summaries filtered by user role and criteria"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        if user_role == "client":
            query = """
                SELECT ms.*, p.ProjectTitle
                FROM MeetingSummaries ms
                JOIN Projects p ON ms.ProjectId = p.Id
                WHERE p.ClientId = ?
            """
            params = [user_id]
        elif user_role == "freelancer":
            query = """
                SELECT ms.*, p.ProjectTitle
                FROM MeetingSummaries ms
                JOIN Projects p ON ms.ProjectId = p.Id
                WHERE ms.FreelancerId = ?
            """
            params = [user_id]
        else:
            return {"status": "error", "message": "Invalid user role"}
        
        # Add filters
        if project_ids:
            placeholders = ",".join(["?"] * len(project_ids))
            query += f" AND ms.ProjectId IN ({placeholders})"
            params.extend(project_ids)
        
        if date_from:
            query += " AND ms.CreatedAt >= ?"
            params.append(date_from)
        
        if date_to:
            query += " AND ms.CreatedAt <= ?"
            params.append(date_to)
        
        query += " ORDER BY ms.CreatedAt DESC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        summaries = []
        for row in results:
            summaries.append({
                "id": row[0],
                "freelancerId": row[1],
                "projectId": row[2],
                "freelancerName": row[3],
                "projectName": row[4],
                "summary": row[5],
                "blocker": row[6],
                "createdAt": row[7]
            })
        
        return {"status": "success", "data": summaries}
        
    except Exception as e:
        print(f"Error getting meeting summaries: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        if 'connection' in locals() and connection:
            cursor.close()
            connection.close()
 
 