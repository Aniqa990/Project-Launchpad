# 📁 File: app/db.py
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def insert_resume(file_name, file_data):
    conn = get_connection()
    cursor = conn.cursor()
    sql = "INSERT INTO resumes (filename, filedata) VALUES (%s, %s)"
    cursor.execute(sql, (file_name, file_data))
    resume_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()
    return resume_id

def insert_parsed_resume(resume_id, parsed_json):
    conn = get_connection()
    cursor = conn.cursor()
    sql = "INSERT INTO parsed_resumes (resume_id, parsed_json) VALUES (%s, %s)"
    cursor.execute(sql, (resume_id, parsed_json))
    conn.commit()
    cursor.close()
    conn.close()

def fetch_freelancer_id_by_resume(resume_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM freelancers WHERE resume_id = %s", (resume_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result['id'] if result else None

# 📁 File: app/profile_updater.py
from app.db import get_connection

def insert_or_get_freelancer(resume_id, data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM freelancers WHERE resume_id = %s", (resume_id,))
    result = cursor.fetchone()
    if result:
        freelancer_id = result['id']
        cursor.execute("""
            UPDATE freelancers
            SET name=%s, email=%s, phone=%s, summary=%s
            WHERE id=%s
        """, (data['name'], data['email'], data['phone'], data['summary'], freelancer_id))
    else:
        cursor.execute("""
            INSERT INTO freelancers (resume_id, name, email, phone, summary)
            VALUES (%s, %s, %s, %s, %s)
        """, (resume_id, data['name'], data['email'], data['phone'], data['summary']))
        freelancer_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()
    return freelancer_id

def insert_skills(freelancer_id, skills, source='parsed'):
    conn = get_connection()
    cursor = conn.cursor()
    for skill in skills:
        cursor.execute("""
            INSERT IGNORE INTO skills (freelancer_id, skill_name, source)
            VALUES (%s, %s, %s)
        """, (freelancer_id, skill, source))
    conn.commit()
    cursor.close()
    conn.close()

def insert_projects(freelancer_id, projects, source='parsed'):
    conn = get_connection()
    cursor = conn.cursor()
    for p in projects:
        cursor.execute("""
            INSERT IGNORE INTO projects (freelancer_id, title, description, source)
            VALUES (%s, %s, %s, %s)
        """, (freelancer_id, p['title'], p['description'], source))
    conn.commit()
    cursor.close()
    conn.close()

def insert_experience(freelancer_id, experience, source='parsed'):
    conn = get_connection()
    cursor = conn.cursor()
    for exp in experience:
        cursor.execute("""
            INSERT IGNORE INTO experience (freelancer_id, title, company, duration, description, source)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (freelancer_id, exp['title'], exp['company'], exp['duration'], exp['description'], source))
    conn.commit()
    cursor.close()
    conn.close()

def save_freelancer_profile(resume_id, parsed_json):
    freelancer_id = insert_or_get_freelancer(resume_id, parsed_json)
    insert_skills(freelancer_id, parsed_json.get('skills', []))
    insert_projects(freelancer_id, parsed_json.get('projects', []))
    insert_experience(freelancer_id, parsed_json.get('experience', []))
    return freelancer_id
