import os
import requests
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def call_groq_llm(transcript_text: str):
    """
    Calls Groq LLM using llama-3-70b model via OpenAI-compatible endpoint.
    Sends transcript and expects structured JSON + cleaned summary in reply.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = (
        "You are a helpful AI Scrum assistant. Given a standup transcript, "
        "extract structured information and provide a cleaned transcript:\n\n"
        "1. Return a JSON object with keys: name, project_name, summary, blockers.\n"
        "3. For 'blockers': Extract any obstacles, challenges, or issues mentioned that are blocking progress.\n"
        "Respond only in this JSON format:\n"
        "{\n"
        '  "status": "success",\n'
        '  "json_output": { "name": "...", "project_name": "...", "summary": "...", "blockers": "..." },\n'
        '  "cleaned_text": "..." \n'
        "}"
    )

    payload = {
        "model": "llama3-70b-8192",  # Groq model name
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": transcript_text}
        ],
        "temperature": 0.3,
        "max_tokens": 2048
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        reply = response.json()
        content = reply["choices"][0]["message"]["content"]
        return eval(content) if content.strip().startswith("{") else {
            "status": "error",
            "error": "Unexpected response format from Groq"
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
