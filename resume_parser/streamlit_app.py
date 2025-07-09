import streamlit as st
from dotenv import load_dotenv
import os

from app.resume_handler import handle_resume_upload
from app.fetch_profile import (
    get_freelancer_by_email, get_skills,
    get_projects, get_experience
)
from app.profile_updater import (
    insert_skills, insert_projects, insert_experience
)

from app.db import get_connection

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

st.set_page_config(page_title='Resume Extractor', page_icon='📄', layout='centered')
st.title('📄 Resume Information Extractor')

uploaded_file = st.file_uploader('Upload your resume (PDF or DOCX)', type=['pdf', 'docx'])

# Store persistent data
if 'parsed_json' not in st.session_state:
    st.session_state.parsed_json = None
if 'freelancer_id' not in st.session_state:
    st.session_state.freelancer_id = None

# Resume Upload Handler
if uploaded_file and st.button('🔍 Extract and Save to DB'):
    with st.spinner("Processing..."):
        parsed_json, error = handle_resume_upload(uploaded_file, GROQ_API_KEY)
        if error:
            st.error(error)
        else:
            st.session_state.parsed_json = parsed_json
            st.success("Resume parsed and saved successfully!")

            freelancer = get_freelancer_by_email(parsed_json['email'])
            if freelancer:
                st.session_state.freelancer_id = freelancer['id']

# Load from session state
parsed_json = st.session_state.parsed_json
freelancer_id = st.session_state.freelancer_id

# Show and Edit Profile
if parsed_json and freelancer_id:

    st.subheader("📝 Edit Summary")
    summary_text = st.text_area("Summary", value=parsed_json['summary'], height=120)
    if st.button("Update Summary"):
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE freelancers SET summary = %s WHERE id = %s", (summary_text, freelancer_id))
            conn.commit()
            cursor.close()
            conn.close()
            st.success("✅ Summary updated in database!")
        except Exception as e:
            st.error(f"❌ Failed to update summary: {e}")

    # Skills Section
    st.subheader("💡 Skills")

skills = get_skills(freelancer_id)
for s in skills:
    col1, col2 = st.columns([4, 1])
    with col1:
        st.markdown(f"- {s['skill']} ({s['source']})")
    with col2:
        if st.button(f"❌", key=f"del_skill_{s['id']}"):
            try:
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM skills WHERE id = %s", (s['id'],))
                conn.commit()
                cursor.close()
                conn.close()
                st.success("✅ Skill deleted!")
                st.experimental_rerun()
            except Exception as e:
                st.error(f"❌ Failed to delete skill: {e}")

new_skill = st.text_input("Add new skill")
if st.button("Add Skill"):
    if new_skill.strip():
        try:
            insert_skills(freelancer_id, [new_skill.strip()], source='manual')
            st.success("✅ Skill added!")
            st.experimental_rerun()
        except Exception as e:
            st.error(f"❌ Failed to add skill: {e}")
    else:
        st.warning("⚠️ Skill name cannot be empty.")


    # Projects Section
    st.subheader("🚀 Projects")

projects = get_projects(freelancer_id)
for p in projects:
    with st.expander(f"{p['title']} ({p['source']})"):
        st.markdown(p['description'])
        if st.button(f"❌ Delete Project", key=f"del_project_{p['id']}"):
            try:
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM projects WHERE id = %s", (p['id'],))
                conn.commit()
                cursor.close()
                conn.close()
                st.success("✅ Project deleted!")
                st.experimental_rerun()
            except Exception as e:
                st.error(f"❌ Failed to delete project: {e}")

proj_title = st.text_input("Project Title")
proj_desc = st.text_area("Project Description", height=100)
if st.button("Add Project"):
    if proj_title.strip() and proj_desc.strip():
        try:
            insert_projects(freelancer_id, [{
                "title": proj_title.strip(),
                "description": proj_desc.strip()
            }], source='manual')
            st.success("✅ Project added!")
            st.experimental_rerun()
        except Exception as e:
            st.error(f"❌ Failed to add project: {e}")
    else:
        st.warning("⚠️ Title and description cannot be empty.")


    st.subheader("🏢 Experience")

experience = get_experience(freelancer_id)
for e in experience:
    with st.expander(f"{e['title']} at {e['company']} ({e['duration']})"):
        st.markdown(e['description'])
        if st.button(f"❌ Delete Experience", key=f"del_exp_{e['id']}"):
            try:
                conn = get_connection()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM experience WHERE id = %s", (e['id'],))
                conn.commit()
                cursor.close()
                conn.close()
                st.success("✅ Experience deleted!")
                st.experimental_rerun()
            except Exception as ex:
                st.error(f"❌ Failed to delete experience: {ex}")

exp_title = st.text_input("Job Title")
exp_company = st.text_input("Company Name")
exp_duration = st.text_input("Duration (e.g., Jan 2021 - Feb 2022)")
exp_desc = st.text_area("Job Description", height=100)
if st.button("Add Experience"):
    if all([exp_title.strip(), exp_company.strip(), exp_duration.strip(), exp_desc.strip()]):
        try:
            insert_experience(freelancer_id, [{
                "title": exp_title.strip(),
                "company": exp_company.strip(),
                "duration": exp_duration.strip(),
                "description": exp_desc.strip()
            }], source='manual')
            st.success("✅ Experience added!")
            st.experimental_rerun()
        except Exception as e:
            st.error(f"❌ Failed to add experience: {e}")
    else:
        st.warning("⚠️ All fields are required for experience.")

