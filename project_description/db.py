import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )

def insert_project(name, description, domain, skills, freelancers, budget, deadline):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO client_projects 
            (project_name, description, domain, skills_required, no_of_freelancers, budget, deadline)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, description, domain, skills, freelancers, budget, deadline))
        conn.commit()
    conn.close()

def fetch_projects():
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM client_projects ORDER BY created_at DESC")
        result = cursor.fetchall()
    conn.close()
    return result
