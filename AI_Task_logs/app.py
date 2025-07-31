from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware  # Add this line!
import requests
import re
 
app = FastAPI(
    title="Transcript Combiner API",
    description="Merge and process timestamped transcripts from text URLs.",
    version="1.0.0"
)
 
class TranscriptRequest(BaseModel):
    links: List[str]
 
def parse_timestamp_to_ms(ts: str) -> int:
    h, m, s = map(int, ts.split(":"))
    return (h * 3600 + m * 60 + s) * 1000
 
def extract_lines(content: str):
    extracted = []
    for line in content.splitlines():
        match = re.match(r"\[(\d{2}:\d{2}:\d{2})\]\s+(.*)", line)
        if match:
            ts = match.group(1)
            text = match.group(2).strip()
            ms = parse_timestamp_to_ms(ts)
            extracted.append({
                "timestamp": ts,
                "text": text,
                "timestamp_ms": ms
            })
    return extracted


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],  # Your React app URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

 
@app.post("/combine-transcripts-json", summary="Combine transcripts from URLs", tags=["Transcript"])
def combine_transcripts_json(request: TranscriptRequest):
    """
    Fetches and combines timestamped transcripts from provided URLs.
 
    Each line in the `.txt` must follow this format:
    ```
    [HH:MM:SS] Sentence content
    ```
 
    ### Request Body:
    - `links`: List of raw `.txt` URLs containing transcript data.
 
    ### Returns:
    - List of dicts sorted by timestamp with `timestamp` and `text`.
 
    ### Example Response:
    ```json
    [
      {
        "timestamp": "00:00:01",
        "text": "Hello team, let's begin."
      }
    ]
    """
    combined_entries = []
 
    for link in request.links:
        try:
            response = requests.get(link)
            if response.status_code != 200:
                return {"error": f"Failed to fetch: {link}"}
            entries = extract_lines(response.text)
            combined_entries.extend(entries)
        except Exception as e:
            return {"error": str(e), "link": link}
 
    combined_entries.sort(key=lambda x: x["timestamp_ms"])
 
    # Remove internal timestamp_ms field before returning
    for entry in combined_entries:
        entry.pop("timestamp_ms")
 
    return combined_entries
 