import os
import json
import requests
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
 
# -------------------- Load Environment --------------------
load_dotenv()
GIST_ID = os.getenv("GIST_ID")
FILENAME = os.getenv("GIST_FILENAME", "gistfile1.txt")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
 
# -------------------- FastAPI App --------------------
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# -------------------- Headers --------------------
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}
 
# -------------------- Models --------------------
class ProjectPayload(BaseModel):
    id: str
    projectTitle: str
    description: str
 
class MeetingPayload(BaseModel):
    transcript: str
    datetime: str | None = None  # Optional, defaults to now
 
class AssignFreelancerPayload(BaseModel):
    id: str
    freelancerId: str
    freelancerName: str
 
# -------------------- Load Gist Content --------------------
def load_gist():
    url = f"https://api.github.com/gists/{GIST_ID}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code != 200:
        raise Exception(f"❌ Failed to load gist: {response.status_code} - {response.text}")
   
    data = response.json()
    content = data["files"][FILENAME]["content"]
 
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        print("⚠️ Invalid JSON in gist. Reinitializing...")
        return {"projects": [], "meetings": []}
 
# -------------------- Save Updated Content --------------------
def update_gist(data):
    updated_content = json.dumps(data, indent=2)
    payload = {
        "files": {
            FILENAME: {
                "content": updated_content
            }
        }
    }
 
    url = f"https://api.github.com/gists/{GIST_ID}"
    response = requests.patch(url, headers=HEADERS, json=payload)
    if response.status_code != 200:
        raise Exception(f"❌ Failed to update gist: {response.status_code} - {response.text}")
    return response.json()