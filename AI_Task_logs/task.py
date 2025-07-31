import json
import uuid
import os
from datetime import datetime
from fastapi import FastAPI, Body
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware  # Add this line!
from dotenv import load_dotenv
from openai import OpenAI

# -------------------- Init --------------------
load_dotenv()
client = OpenAI(api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
app = FastAPI()

# -------------------- Schemas --------------------
class UserInfo(BaseModel):
    FirstName: str
    LastName: str

class ExistingTask(BaseModel):
    Id: int
    Title: str
    Description: str
    EstimatedDeadline: str
    Priority: int
    Status: int
    CreatedAt: str
    CreatedByUser: UserInfo
    AssignedToUser: UserInfo

class TranscriptItem(BaseModel):
    timestamp: str  # HH:MM:SS or [HH:MM:SS]
    text: str       # Format: "Speaker: message"


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],  # Your React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Helpers --------------------
def extract_json_from_response(text):
    try:
        json_start = text.find('{')
        json_end = text.rfind('}') + 1
        json_str = text[json_start:json_end]
        parsed = json.loads(json_str)
        return parsed.get("tasks", [])
    except Exception as e:
        print("❌ Failed to parse model output:", e)
        return []

def assign_uuids(tasks):
    for task in tasks:
        if not task.get("task_id"):
            task["task_id"] = f"task-{uuid.uuid4()}"
    return tasks

def get_freelancer_id(name, directory):
    for entry in directory:
        if entry["name"].lower() == name.lower():
            return entry["id"]
    return 0

def normalize_existing_tasks(existing_tasks, project_id, freelancer_directory):
    normalized = []
    for task in existing_tasks:
        assigned_to = f"{task['AssignedToUser']['FirstName']} {task['AssignedToUser']['LastName']}"
        created_by = f"{task['CreatedByUser']['FirstName']} {task['CreatedByUser']['LastName']}"
        normalized.append({
            "task_id": f"task-{uuid.uuid4()}",
            "title": task["Title"],
            "description": task["Description"],
            "estimated_deadline": task["EstimatedDeadline"],
            "priority": task["Priority"],
            "status": task["Status"],
            "created_at": task["CreatedAt"],
            "created_by": created_by,
            "created_by_id": get_freelancer_id(created_by, freelancer_directory),
            "assigned_to": assigned_to,
            "freelancer_id": get_freelancer_id(assigned_to, freelancer_directory),
            "project_id": project_id
        })
    return normalized

# -------------------- Core Logic --------------------
def generate_updated_tasks(project_id, project_description, existing_tasks_raw, transcription, freelancer_directory_id_keyed):
    freelancer_directory = [{"name": name, "id": int(fid)} for fid, name in freelancer_directory_id_keyed.items()]
    normalized_tasks = normalize_existing_tasks(existing_tasks_raw, project_id, freelancer_directory)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a smart assistant that updates and expands a task list based on a project description, "
                "existing tasks, and a meeting transcript.\n\n"
                "Instructions:\n"
                "1. You MAY generate new top-level tasks if the transcript includes relevant action items.\n"
                "2. Try to detect who is assigning the task and to whom (e.g., 'Ahmed: Assign the frontend to John').\n"
                "3. Match names to freelancer IDs using the freelancer directory.\n"
                "4. Each task must include:\n"
                "   - task_id (string like 'task-<uuid>')\n"
                "   - title, description, estimated_deadline, priority, created_at (use current UTC if missing), status\n"
                "   - assigned_to, freelancer_id, created_by, created_by_id, project_id\n"
                "5. Return only JSON in this format:\n"
                "{ \"tasks\": [...] }"
            )
        },
        {
            "role": "user",
            "content": (
                f"Project ID: {project_id}\n"
                f"Project description:\n{project_description}\n\n"
                f"Existing tasks:\n{json.dumps(normalized_tasks, indent=2)}\n\n"
                f"Meeting transcription:\n{transcription}\n\n"
                f"Freelancer directory:\n{json.dumps(freelancer_directory, indent=2)}\n\n"
                "Generate new top-level tasks based on the transcript."
            )
        }
    ]

    response = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=messages,
        temperature=0.2,
    )

    reply = response.choices[0].message.content.strip()
    print("🧠 Model raw output:\n", reply)

    tasks = extract_json_from_response(reply)
    tasks = assign_uuids(tasks)

    for task in tasks:
        if not task.get("created_at"):
            task["created_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    return tasks

# -------------------- API Endpoint --------------------
@app.post("/generate-tasks")
def generate_tasks(
    project_id: str = Body(...),
    project_description: str = Body(...),
    existing_tasks: List[ExistingTask] = Body(...),
    transcript_items: List[TranscriptItem] = Body(...),
    freelancer_directory: Dict[int, str] = Body(...)
):
    def to_seconds(ts: str):
        ts = ts.strip("[]")  # ✅ Remove brackets like [00:00:28] -> 00:00:28
        h, m, s = map(int, ts.split(":"))
        return h * 3600 + m * 60 + s

    sorted_transcript = sorted(transcript_items, key=lambda x: to_seconds(x.timestamp))
    transcript_text = " ".join([item.text for item in sorted_transcript])

    updated_tasks = generate_updated_tasks(
        project_id,
        project_description,
        [task.dict() for task in existing_tasks],
        transcript_text,
        freelancer_directory
    )

    return {"tasks": updated_tasks}
