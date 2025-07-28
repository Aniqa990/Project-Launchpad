# github/uploader.py — for uploading to Gist (append mode)
import os
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GIST_ID = os.getenv("GIST_ID")  # Gist ID to update
GIST_FILENAME = os.getenv("GIST_FILENAME", "transcript.txt")

def upload_file_to_github(filepath):
    """
    Append local file content to an existing GitHub Gist file.
    """
    url = f"https://api.github.com/gists/{GIST_ID}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}"
    }

    # Step 1: Get existing content from Gist
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch Gist: {response.status_code} {response.text}")

    gist_data = response.json()
    existing_content = gist_data["files"].get(GIST_FILENAME, {}).get("content", "")

    # Step 2: Read new content from local file
    with open(filepath, "r", encoding="utf-8") as f:
        new_content = f.read()

    # Step 3: Append
    combined_content = existing_content + "\n\n" + new_content

    # Step 4: Upload back
    data = {
        "files": {
            GIST_FILENAME: {
                "content": combined_content
            }
        },
        "description": f"Appended transcript on {datetime.now():%Y-%m-%d %H:%M}"
    }

    response = requests.patch(url, json=data, headers=headers)

    if response.status_code != 200:
        raise Exception(f"Gist update failed: {response.status_code} {response.text}")

    return response.json()
