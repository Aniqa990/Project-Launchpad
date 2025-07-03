# app/resume_handler.py
import os
import pdfplumber
from docx import Document
import tempfile
import requests
import json

from app.db import insert_resume, insert_parsed_resume
from app.utils import extract_json_from_groq_response

def extract_text_from_resume(uploaded_file):
    resume_text = ''
    file_type = uploaded_file.name.split('.')[-1].lower()

    if file_type == 'pdf':
        with pdfplumber.open(uploaded_file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    resume_text += text + '\n'

    elif file_type == 'docx':
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
            tmp.write(uploaded_file.read())
            tmp_path = tmp.name
        try:
            doc = Document(tmp_path)
            for para in doc.paragraphs:
                resume_text += para.text + '\n'
        finally:
            os.unlink(tmp_path)
    return resume_text

def call_groq_llm(resume_text, api_key):
    prompt = f"""
You are an expert resume parser. Your task is to convert the following resume text into a standardized JSON format.

🔸 The output JSON must strictly follow this structure:
{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "summary": "Short professional summary or about me (generate if missing)",
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "duration": "e.g., Jan 2020 - Dec 2022",
      "description": "Responsibilities and accomplishments"
    }}
  ],
  "projects": [
    {{
      "title": "Project Title",
      "description": "What the project is, tools used, outcome"
    }}
  ],
  "skills": ["Python", "SQL", "Machine Learning"]
}}

🔸 Important:
- Always return this exact structure (even if fields are empty).
- If "summary" or "about me" is not in the resume, generate one based on the tone and content.
- Make sure lists like experience, projects, and skills are always present (even if empty).
- Respond with **only the raw JSON**, without markdown, comments, or explanation.

Resume Text:
{resume_text}
"""

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    data = {
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': prompt}
        ],
        'model': 'llama-3.1-8b-instant',
        'max_tokens': 2048
    }

    response = requests.post(
        'https://api.groq.com/openai/v1/chat/completions',
        headers=headers,
        json=data
    )

    if response.status_code == 200:
        content = response.json()['choices'][0]['message']['content']
        parsed_json = extract_json_from_groq_response(content)
        return parsed_json, content
    return None, response.text

def handle_resume_upload(uploaded_file, api_key):
    resume_text = extract_text_from_resume(uploaded_file)
    if not resume_text:
        return None, "No text could be extracted from the file."

    # Save the original file to DB
    file_data = uploaded_file.getvalue()
    resume_id = insert_resume(uploaded_file.name, file_data)

    # Call Groq to parse JSON
    parsed_json, raw_response = call_groq_llm(resume_text, api_key)
    if parsed_json is None:
        return None, "Failed to extract valid JSON from Groq."

    # Store parsed JSON to parsed_resumes
    insert_parsed_resume(resume_id, json.dumps(parsed_json))

    return parsed_json, None
