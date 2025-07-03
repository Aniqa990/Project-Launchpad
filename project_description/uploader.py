from db import insert_project

def save_project(name, description, domain, skills, freelancers, budget, deadline):
    if not all([name, description, domain, skills, deadline]):
        raise ValueError("All fields except budget and freelancers must be provided.")
    insert_project(name, description, domain, skills, freelancers, budget, deadline)
