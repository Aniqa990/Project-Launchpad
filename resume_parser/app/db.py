# app/db.py
import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
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

def fetch_parsed_resume(resume_id):
    conn = get_connection()
    cursor = conn.cursor()
    sql = "SELECT parsed_json FROM parsed_resumes WHERE resume_id = %s"
    cursor.execute(sql, (resume_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] if result else None
