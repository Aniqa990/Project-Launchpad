# streamlit_app.py
import streamlit as st
from dotenv import load_dotenv
import os

from app.resume_handler import handle_resume_upload

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

st.set_page_config(page_title='Resume Extractor', page_icon='📄', layout='centered')
st.title('📄 Resume Information Extractor')
st.write('Upload your resume (PDF or DOCX) and extract structured information.')

uploaded_file = st.file_uploader('Upload your resume', type=['pdf', 'docx'])

if uploaded_file:
    if st.button('🔍 Extract and Save to DB'):
        with st.spinner("Processing..."):
            parsed_json, error = handle_resume_upload(uploaded_file, GROQ_API_KEY)
            if error:
                st.error(error)
            else:
                st.success("Resume parsed and saved successfully!")
                st.subheader('Extracted Structured Information')
                st.json(parsed_json)
else:
    st.info("Please upload a resume to continue.")
