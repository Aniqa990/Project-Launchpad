# 📄 Resume Parser & Profile Builder with Streamlit + Groq + MySQL

A full-featured resume parsing and profile management system built with **Streamlit**, powered by **Groq LLM** for intelligent extraction, and storing structured data in a **normalized MySQL schema**.

---

## 🚀 Features

- ✅ Upload resume (PDF or DOCX)
- ✅ Extract structured JSON via **Groq LLM**
- ✅ Store original file and parsed data
- ✅ Normalized DB schema: freelancers, skills, projects, experience
- ✅ Support for:
  - 🔹 Manual edits
  - 🔹 Skill/project/experience addition
  - 🔹 Deletion from DB
- ❌ Prevents duplicate freelancer creation via email
- ✅ Clear error messages on duplicates

---

## 📁 Directory Structure

resume_parser/
├── app/
│ ├── db.py # DB connection + core insert functions
│ ├── resume_handler.py # Main logic to handle parsing and DB storage
│ ├── profile_updater.py # Insert parsed JSON into normalized tables
│ ├── fetch_profile.py # Fetch profile data for UI
│ └── utils.py # Utility function to clean LLM JSON
├── streamlit_app.py # Main Streamlit UI
├── requirements.txt
├── .env # API keys and DB config
└── README.md

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

DROP DATABASE IF EXISTS resume_db;
CREATE DATABASE resume_db;
USE resume_db;

-- Freelancer Table
CREATE TABLE freelancers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id INT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    summary TEXT
);

-- Skills Table
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT,
    skill_name VARCHAR(100),
    source ENUM('parsed', 'manual') DEFAULT 'parsed',
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE
);

-- Projects Table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT,
    title VARCHAR(255),
    description TEXT,
    source ENUM('parsed', 'manual') DEFAULT 'parsed',
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE
);

-- Experience Table
CREATE TABLE experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT,
    title VARCHAR(255),
    company VARCHAR(255),
    duration VARCHAR(100),
    description TEXT,
    source ENUM('parsed', 'manual') DEFAULT 'parsed',
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id) ON DELETE CASCADE
);

-- Original Resume Files
CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255),
    filedata LONGBLOB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parsed JSON (optional for backup)
CREATE TABLE parsed_resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resume_id INT,
    parsed_json JSON,
    parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

GROQ_API_KEY=your_groq_api_key_here

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=resume_db

streamlit run streamlit_app.py
