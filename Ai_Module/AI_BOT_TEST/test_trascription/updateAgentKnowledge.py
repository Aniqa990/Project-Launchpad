import os
import requests
from dotenv import load_dotenv
 
# Load environment variables
load_dotenv()
 
# --- Add URL to Knowledge Base ---
def add_url_to_kb(url: str) -> dict:
    api_key = os.getenv("ELEVEN_API_KEY")
    if not api_key:
        raise EnvironmentError("ELEVEN_API_KEY not set in .env file.")
 
    response = requests.post(
        "https://api.elevenlabs.io/v1/convai/knowledge-base/url",
        headers={"xi-api-key": api_key},
        json={"url": url}
    )
 
    if response.status_code == 200:
        data = response.json()
        doc_id = data.get("id")
        name = data.get("name")
        print(f" Document added to KB:\n ID: {doc_id}\n Name: {name}")
        return {"id": doc_id, "name": name}
    else:
        print(f" Failed to add URL. Status: {response.status_code}")
        print("Details:", response.text)
        return {}
 
# --- Update Agent with KB ---
def update_agent_with_kb(kb_id: str, kb_name: str):
    api_key = os.getenv("ELEVEN_API_KEY")
    agent_id = os.getenv("AGENT_ID")
 
    if not api_key or not agent_id:
        raise EnvironmentError("ELEVEN_API_KEY or AGENT_ID not set in .env file.")
 
    endpoint = f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}"
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "knowledge_base": [
                        {
                            "id": kb_id,
                            "name": kb_name,
                            "type": "url"
                        }
                    ]
                }
            }
        }
    }
 
    response = requests.patch(
        endpoint,
        headers={"xi-api-key": api_key},
        json=payload
    )
 
    if response.status_code == 200:
        print(" Agent updated successfully with knowledge base.")
    else:
        print(f" Failed to update agent. Status: {response.status_code}")
        print("Details:", response.text)
 
def clear_agent_kb():
    """
    Clears all documents from the ElevenLabs agent's knowledge base.
    """
    api_key = os.getenv("ELEVEN_API_KEY")
    agent_id = os.getenv("AGENT_ID")
 
    if not api_key or not agent_id:
        raise EnvironmentError("ELEVEN_API_KEY or AGENT_ID not set in .env file.")
 
    endpoint = f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}"
    payload = {
        "conversation_config": {
            "agent": {
                "prompt": {
                    "knowledge_base": []
                }
            }
        }
    }
 
    response = requests.patch(
        endpoint,
        headers={"xi-api-key": api_key},
        json=payload
    )
 
    if response.status_code == 200:
        print(" Agent knowledge base cleared.")
        return response.json()
    else:
        print(f" Failed to clear knowledge base. Status: {response.status_code}")
        print("Details:", response.text)
        return None
 
def delete_kb_document(doc_id: str):
    api_key = os.getenv("ELEVEN_API_KEY")
    if not api_key:
        raise EnvironmentError("ELEVEN_API_KEY not set.")
 
    url = f"https://api.elevenlabs.io/v1/convai/knowledge-base/{doc_id}"
    response = requests.delete(url, headers={"xi-api-key": api_key})
 
    if response.status_code in (200, 204):
        print(f"Deleted KB document {doc_id}")
        return True
    else:
        print("Failed to delete document:", response.status_code)
        print("Details:", response.text)
        return False
 
 
if __name__ == "__main__":
    url = "https://en.wikipedia.org/wiki/Main_Page"
    kb_data = add_url_to_kb(url)
    if kb_data:
        update_agent_with_kb(kb_data['id'], kb_data['name'])
 
 