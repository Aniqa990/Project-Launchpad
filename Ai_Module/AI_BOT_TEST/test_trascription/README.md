# 🤖 AI Scrum Master – Automated Voice Standup Agent

An intelligent agent that acts as a Scrum Master. It records voice-based standup meetings, transcribes them using AssemblyAI, analyzes them using Groq LLaMA-3 LLM, stores structured data in a MySQL database, and logs everything to GitHub in real-time.

---

## 🚀 Features

- 🎙️ Voice-based 1:1 standup meeting recording
- ✍️ Real-time transcription via AssemblyAI (with speaker diarization)
- 🧠 Intelligent task summarization via Groq LLaMA-3 70B model
- 🗃️ Structured data (project name, summary, blockers) stored in MySQL
- 📄 Final cleaned transcript saved as `.docx` and `.txt`
- ☁️ Auto-commits meeting logs to a GitHub Gist

---

## 📂 Directory Structure

Test_Transcription/
│
├── main.py # FastAPI main app (recording, transcription, LLM handling)
├── requirements.txt # Python dependencies
├── .env # Environment variables
│
├── audio/ # Stores temporary audio files
│ └── recorded.wav
│
├── docs/ # Stores the final docx/text transcription files
│ └── transcript.docx
│
├── llm/ # Logic for calling GROQ LLM API
│ └── groq_llm.py
│
├── assemblyai_client/ # AssemblyAI client for upload and polling
│ └── client.py
│
├── db/ # DB schema and storage logic
│ ├── schema.sql # MySQL schema
│ └── store.py # Python function to insert JSON into MySQL
│
├── utils/ # Utility functions like formatting transcript
│ ├── formatter.py # .docx and .txt formatting
│
└── github/ # GitHub integration for committing files
└── uploader.py

MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=scrum_logs

pip install -r requirements.txt