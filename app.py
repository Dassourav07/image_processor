import streamlit as st
import requests

BACKEND_URL = "https://image-processor-6dvl.onrender.com/"  

st.title("Image Processing System")

# Upload CSV
st.header("Upload CSV")
uploaded_file = st.file_uploader("Choose a CSV file", type="csv")

if uploaded_file:
    if st.button("Upload"):
        files = {'file': uploaded_file.getvalue()}
        response = requests.post(f"{BACKEND_URL}/upload", files=files)
        if response.status_code == 200:
            st.success("File uploaded successfully!")
            request_id = response.json().get("requestId")
            st.write(f"Request ID: {request_id}")
        else:
            st.error("File upload failed.")

# Check Status
st.header("Check Status")
request_id_input = st.text_input("Enter Request ID")

if st.button("Check Status"):
    if request_id_input:
        response = requests.get(f"{BACKEND_URL}/status/{request_id_input}")
        if response.status_code == 200:
            status_data = response.json()
            st.write(status_data)
        else:
            st.error("Invalid Request ID or No Data Found.")
