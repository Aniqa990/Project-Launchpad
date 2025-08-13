# assemblyai_client/client.py

import requests
import time

class AssemblyAIClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.headers = {
            "authorization": self.api_key,
            "content-type": "application/json"
        }
        self.upload_endpoint = "https://api.assemblyai.com/v2/upload"
        self.transcript_endpoint = "https://api.assemblyai.com/v2/transcript"

    def upload_file(self, file):
        CHUNK_SIZE = 5242880

        def read_chunks():
            while True:
                chunk = file.read(CHUNK_SIZE)
                if not chunk:
                    break
                yield chunk

        response = requests.post(
            self.upload_endpoint,
            headers={"authorization": self.api_key},
            data=read_chunks()
        )
        response.raise_for_status()
        return response.json()['upload_url']

    def transcribe_audio(self, audio_url, diarization=False):
        payload = {
            "audio_url": audio_url,
            "speaker_labels": diarization,
        }
        response = requests.post(self.transcript_endpoint, json=payload, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def poll_transcription(self, transcript_id, poll_interval=5):
        url = f"{self.transcript_endpoint}/{transcript_id}"

        while True:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            if data['status'] == 'completed':
                return data
            elif data['status'] == 'error':
                raise RuntimeError(f"Transcription failed: {data.get('error', 'Unknown error')}")
            time.sleep(poll_interval)
