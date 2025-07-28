CREATE TABLE meeting_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    project_name VARCHAR(255),
    summary TEXT,
    blockers TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
