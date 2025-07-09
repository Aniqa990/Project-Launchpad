from app.db import get_connection

def get_freelancer_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, summary FROM freelancers WHERE email = %s", (email,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    if result:
        return {"id": result['id'], "summary": result['summary']}
    return None


def get_skills(freelancer_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, skill_name, source FROM skills WHERE freelancer_id = %s", (freelancer_id,))
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"id": r['id'], "skill": r['skill_name'], "source": r['source']} for r in result]


def get_projects(freelancer_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, description, source FROM projects WHERE freelancer_id = %s", (freelancer_id,))
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": r['id'],
            "title": r['title'],
            "description": r['description'],
            "source": r['source']
        } for r in result
    ]

def get_experience(freelancer_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, company, duration, description, source 
        FROM experience 
        WHERE freelancer_id = %s
    """, (freelancer_id,))
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        {
            "id": r['id'],
            "title": r['title'],
            "company": r['company'],
            "duration": r['duration'],
            "description": r['description'],
            "source": r['source']
        } for r in result
    ]
