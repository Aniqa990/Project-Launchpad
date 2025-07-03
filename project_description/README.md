# 📁 Client Project Description Upload Module

This module allows clients to upload their project requirements through a Streamlit UI. The data is stored in a MySQL database and can later be used to match suitable freelancers using Retrieval-Augmented Generation (RAG).

---

## 🧩 Features

- 📄 Upload project details via form
- 🎯 Fields captured:
  - Project Name
  - Description
  - Domain (e.g., NLP, Web Dev, ML)
  - Skills Required
  - Number of Freelancers Needed
  - Budget
  - Deadline
- 🗃 Stores data in a MySQL table
- 📊 Displays list of uploaded projects
- 🔁 Ready for integration with RAG pipeline or frontend (React)

---

## 🗂️ Directory Structure

project_description/
├── db.py # DB operations (insert, fetch)
├── uploader.py # Handles saving project info to DB
├── viewer.py # Fetch and return project list
├── streamlit_app.py # Streamlit-based upload UI
├── .env # Environment variables (DB credentials)


---

## 🛠️ Setup Instructions

### 1. ✅ Install Dependencies

```bash
pip install -r requirements.txt

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Ali03112349184@
DB_NAME=mazik-internship-db

DROP TABLE IF EXISTS client_projects;

CREATE TABLE client_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(255),
    description TEXT,
    domain VARCHAR(100),
    skills_required TEXT,
    no_of_freelancers INT,
    budget INT,
    deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

cd project_description
streamlit run streamlit_app.py

