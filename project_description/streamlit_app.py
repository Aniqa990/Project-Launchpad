import streamlit as st
from uploader import save_project
from viewer import list_projects

st.set_page_config(page_title="Client Project Upload", page_icon="📁")

st.title("📁 Upload Client Project Description")

with st.form("upload_form"):
    name = st.text_input("Project Name")
    desc = st.text_area("Project Description", height=150)
    domain = st.text_input("Domain (e.g. NLP, Web Dev, ML)")
    skills = st.text_input("Skills Required (comma-separated)")
    freelancers = st.number_input("Number of Freelancers Needed", min_value=1, step=1)
    budget = st.number_input("Budget", min_value=0, step=1000)
    deadline = st.date_input("Deadline")
    submit = st.form_submit_button("Submit")

if submit:
    try:
        save_project(name, desc, domain, skills, freelancers, budget, deadline)
        st.success("✅ Project saved successfully!")
    except Exception as e:
        st.error(f"❌ Error: {e}")

st.divider()
st.subheader("📄 All Projects")

projects = list_projects()
if not projects:
    st.info("No projects yet.")
else:
    for p in projects:
        st.markdown(f"""
        ### 📌 {p['project_name']} ({p['domain']})
        🕒 Created: {p['created_at']} | 📆 Deadline: {p['deadline']}
        **Skills Required:** {p['skills_required']}  
        **Freelancers Needed:** {p['no_of_freelancers']}  
        **Budget:** ${p['budget']}
        ```
        {p['description']}
        ```
        """)
