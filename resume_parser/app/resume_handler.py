import os
import pdfplumber
import tempfile
import requests
from docx import Document as DocxDocument
from dotenv import load_dotenv

from app.db import (
    update_resume,
    save_resume_file,
    is_email_duplicate,
    update_summary,
    ensure_freelancer_exists
)
from app.utils import extract_json_from_groq_response
from app.profile_updater import update_freelancer_contact,update_freelancer_summary
from app.Embedding import process_freelancer, generate_summary_with_groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def extract_text_from_resume(file_name, file_bytes):
    resume_text = ''
    file_type = file_name.split('.')[-1].lower()

    if file_type == 'pdf':
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        resume_text += text + '\n'
        finally:
            os.unlink(tmp_path)

    elif file_type == 'docx':
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            doc = DocxDocument(tmp_path)
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
      "startDate": "e.g. Jan 2020",
      "endDate": "e.g. Dec 2023",
      "description": "Responsibilities and accomplishments"
    }}
  ],
  "projects": [
    {{
      "title": "Project Title",
      "description": "What the project is, tools used and outcome",
    }}
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}}
🔸 Important:
- Always return this exact structure (even if fields are empty).
- If "summary" or "about me" is not in the resume, generate one based on the tone and content.
- Make sure lists like experience, projects, and skills are always present (even if empty).
- Respond with **only the raw JSON**, without markdown, comments, or explanation.
Resume Text:
{resume_text}
"""

    headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    data = {
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': prompt}
        ],
        'model': 'llama-3.1-8b-instant',
        'max_tokens': 2048
    }

    response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=data)
    if response.status_code == 200:
        content = response.json()['choices'][0]['message']['content']
        return extract_json_from_groq_response(content), content
    return None, response.text

def ensure_summary_with_update(freelancer_id, api_key,parsed_json):
    """
    Ensure that both DB and parsed_json summary fields are set.
    If missing, generate summary via Groq and update using `update_summary`.
    """

    summary_in_json = parsed_json.get("summary", "").strip()

    # Check if DB summary is missing (use separate query or assume it's synced if your code relies only on JSON)
    needs_update = False

    if not summary_in_json:
        needs_update = True

    if needs_update:
        # Generate new summary via Groq
        generated_summary = generate_summary_with_groq(parsed_json, api_key)

        # Fallback if Groq fails
        if not generated_summary:
            generated_summary = "Experienced freelancer with relevant technical expertise."

        # Use update_summary to sync both DB and JSON
        update_summary(freelancer_id, generated_summary)

        print(f"✅ Summary updated for freelancer {freelancer_id}")
        return generated_summary, None

    else:
        print(f"⚙️ Summary already exists for freelancer {freelancer_id}, skipping generation.")
        return parsed_json["summary"], None
    

 
def deduplicate_list_of_dicts(items, key_fields):
    seen = set()
    unique_items = []
    for item in items:
        identifier = tuple(item.get(k, "").strip().lower() for k in key_fields)
        if identifier not in seen:
            seen.add(identifier)
            unique_items.append(item)
    return unique_items
 
def deduplicate_skills_list(skills):
    return list(set(s.strip().lower() for s in skills if isinstance(s, str)))
 
def deduplicate_resume(parsed):
    if "skills" in parsed and isinstance(parsed["skills"], list):
        parsed["skills"] = deduplicate_skills_list(parsed["skills"])
 
    if "projects" in parsed and isinstance(parsed["projects"], list):
        parsed["projects"] = deduplicate_list_of_dicts(parsed["projects"], key_fields=["title", "description"])
 
    if "experience" in parsed and isinstance(parsed["experience"], list):
        parsed["experience"] = deduplicate_list_of_dicts(parsed["experience"], key_fields=["company", "title", "description"])
 
    return parsed
 
# ---------------- Main Handler Function ----------------
 
def handle_resume_upload(uploaded_file, api_key, freelancer_id):
    file_name = uploaded_file.filename
    file_bytes = uploaded_file.file.read()
 
    resume_text = extract_text_from_resume(file_name, file_bytes)
    if not resume_text:
        return None, "No text could be extracted."
 
    ensure_freelancer_exists(freelancer_id)
    save_resume_file(freelancer_id, file_name, file_bytes)
 
    new_parsed_json, raw_response = call_groq_llm(resume_text, api_key)
    if new_parsed_json is None:
        return None, f"Parsing failed. Groq response: {raw_response}"
 
    # ✅ Remove duplicates
    new_parsed_json = deduplicate_resume(new_parsed_json)
 
    # Check for email duplication
    if is_email_duplicate(new_parsed_json.get("email"), freelancer_id):
        return None, f"Email {new_parsed_json.get('email')} already exists."
 
    merged_json = update_resume(freelancer_id, new_parsed_json)
 
    summary, err = ensure_summary_with_update(freelancer_id, api_key, new_parsed_json)
    if err:
        return None, err
 
    merged_json = update_resume(freelancer_id, new_parsed_json)
 
    update_freelancer_contact(
        freelancer_id,
        merged_json["name"],
        merged_json["email"],
        merged_json["phone"],
    )
    update_freelancer_summary(freelancer_id, merged_json["summary"])
 
    process_freelancer({
        "freelancer_id": str(freelancer_id),
        "parsed_resume": merged_json,
        "hourly_rate": merged_json.get("hourly_rate", 0),
        "availability": merged_json.get("availability", "Unknown")
    }, api_key)
 
    return merged_json, None
 
 



# import os
# import pdfplumber
# from docx import Document
# import tempfile
# import requests
# import json

# from app.db import insert_resume, insert_parsed_resume
# from app.utils import extract_json_from_groq_response
# from app.profile_updater import save_freelancer_profile

# def extract_text_from_resume(file_name, file_bytes):
#     resume_text = ''
#     file_type = file_name.split('.')[-1].lower()

#     if file_type == 'pdf':
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
#             tmp.write(file_bytes)
#             tmp_path = tmp.name
#         try:
#             with pdfplumber.open(tmp_path) as pdf:
#                 for page in pdf.pages:
#                     text = page.extract_text()
#                     if text:
#                         resume_text += text + '\n'
#         finally:
#             os.unlink(tmp_path)

#     elif file_type == 'docx':
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
#             tmp.write(file_bytes)
#             tmp_path = tmp.name
#         try:
#             doc = Document(tmp_path)
#             for para in doc.paragraphs:
#                 resume_text += para.text + '\n'
#         finally:
#             os.unlink(tmp_path)

#     return resume_text


# def call_groq_llm(resume_text, api_key):
#     prompt = f"""
# You are an expert resume parser. Your task is to convert the following resume text into a standardized JSON format.
# 🔸 The output JSON must strictly follow this structure:
# {{
#   "name": "Full Name",
#   "email": "email@example.com",
#   "phone": "+1234567890",
#   "summary": "Short professional summary or about me (generate if missing)",
#   "experience": [
#     {{
#       "title": "Job Title",
#       "company": "Company Name",
#       "startDate": "e.g. Jan 2020",
#       "endDate": "e.g. Dec 2023",
#       "description": "Responsibilities and accomplishments"
#     }}
#   ],
#   "projects": [
#     {{
#       "title": "Project Title",
#       "description": "What the project is, tools used and outcome",
#     }}
#   ],
#   "skills": ["Skill 1", "Skill 2", "Skill 3"]
# }}
# 🔸 Important:
# - Always return this exact structure (even if fields are empty).
# - If "summary" or "about me" is not in the resume, generate one based on the tone and content.
# - Make sure lists like experience, projects, and skills are always present (even if empty).
# - Respond with **only the raw JSON**, without markdown, comments, or explanation.
# Resume Text:
# {resume_text}
# """

#     headers = {
#         'Authorization': f'Bearer {api_key}',
#         'Content-Type': 'application/json'
#     }

#     data = {
#         'messages': [
#             {'role': 'system', 'content': 'You are a helpful assistant.'},
#             {'role': 'user', 'content': prompt}
#         ],
#         'model': 'llama-3.1-8b-instant',
#         'max_tokens': 2048
#     }

#     response = requests.post(
#         'https://api.groq.com/openai/v1/chat/completions',
#         headers=headers,
#         json=data
#     )

#     if response.status_code == 200:
#         content = response.json()['choices'][0]['message']['content']
#         parsed_json = extract_json_from_groq_response(content)
#         return parsed_json, content
#     return None, response.text

# def handle_resume_upload(uploaded_file, api_key):
#     file_name = uploaded_file.filename  # FastAPI uses .filename
#     file_bytes = uploaded_file.file.read()  # No need to await, since it's not async here

#     resume_text = extract_text_from_resume(file_name, file_bytes)
#     if not resume_text:
#         return None, "No text could be extracted from the file."

#     resume_id = insert_resume(file_name, file_bytes)

#     parsed_json, raw_response = call_groq_llm(resume_text, api_key)
#     if parsed_json is None:
#         return None, "Failed to extract valid JSON from Groq."

#     insert_parsed_resume(resume_id, json.dumps(parsed_json))

#     # Save to normalized tables
#     save_freelancer_profile(resume_id, parsed_json)

#     return parsed_json, None