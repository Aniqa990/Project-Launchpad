import pymysql
from app.db import get_connection

def insert_or_get_freelancer(resume_id, data):
    conn = get_connection()
    cursor = conn.cursor()

    # Check if already exists
    cursor.execute("SELECT id FROM freelancers WHERE resume_id = %s", (resume_id,))
    result = cursor.fetchone()

    if result:
        freelancer_id = result[0]
        # Always update summary, name, etc.
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
        try:
            cursor.execute("""
                INSERT IGNORE INTO skills (freelancer_id, skill_name, source)
                VALUES (%s, %s, %s)
            """, (freelancer_id, skill, source))
        except:
            continue
    conn.commit()
    cursor.close()
    conn.close()

def insert_projects(freelancer_id, projects, source='parsed'):
    conn = get_connection()
    cursor = conn.cursor()
    for p in projects:
        try:
            cursor.execute("""
                INSERT IGNORE INTO projects (freelancer_id, title, description, source)
                VALUES (%s, %s, %s, %s)
            """, (freelancer_id, p['title'], p['description'], source))
        except:
            continue
    conn.commit()
    cursor.close()
    conn.close()

def insert_experience(freelancer_id, experience, source='parsed'):
    conn = get_connection()
    cursor = conn.cursor()
    for exp in experience:
        try:
            cursor.execute("""
                INSERT IGNORE INTO experience (freelancer_id, title, company, duration, description, source)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (freelancer_id, exp['title'], exp['company'], exp['duration'], exp['description'], source))
        except:
            continue
    conn.commit()
    cursor.close()
    conn.close()

def save_freelancer_profile(resume_id, parsed_json):
    freelancer_id = insert_or_get_freelancer(resume_id, parsed_json)
    insert_skills(freelancer_id, parsed_json.get('skills', []))
    insert_projects(freelancer_id, parsed_json.get('projects', []))
    insert_experience(freelancer_id, parsed_json.get('experience', []))
    return freelancer_id
