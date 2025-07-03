# app/utils.py
import json

def extract_json_from_groq_response(content: str):
    json_start = content.find('{')
    json_end = content.rfind('}') + 1
    if json_start != -1 and json_end != 0:
        try:
            return json.loads(content[json_start:json_end])
        except json.JSONDecodeError:
            return None
    return None
