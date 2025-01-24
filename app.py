from flask import Flask, render_template, request, jsonify
import os
from transformers import pipeline
from PyPDF2 import PdfReader

app = Flask(__name__)

# Setup the path for uploaded PDFs
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize the Hugging Face question-answering pipeline
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

# Route to render the homepage (index.html)
@app.route('/')
def home():
    return render_template('index.html')

# Route to handle PDF upload
@app.route('/upload', methods=['POST'])
def upload_pdf():
    file = request.files.get('pdf_file')
    if file and file.filename.endswith('.pdf'):
        # Save the uploaded file to the 'uploads' folder
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        
        # Extract text from the uploaded PDF
        extracted_text = extract_pdf_text(file_path)
        
        # Return the extracted content to the front-end
        return jsonify({"message": "PDF uploaded and content extracted successfully", "extracted_text": extracted_text[:500]})  # Show part of text
        
    else:
        return jsonify({"message": "Invalid file format. Please upload a PDF."}), 400

# Route to handle question-answering
@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.get_json()
        question = data.get('question')
        pdf_content = data.get('pdf_content')

        if not question or not pdf_content:
            return jsonify({"message": "Missing question or PDF content."}), 400

        # Log for debugging
        print("Running question-answering pipeline...")

        # Run the question-answering pipeline
        answer = qa_pipeline(question=question, context=pdf_content)
        print(f"Answer: {answer}")  # Log the answer for debugging

        return jsonify({"answer": answer['answer']})

    except Exception as e:
        print(f"Error occurred: {e}")
        return jsonify({"message": "An error occurred while processing the question."}), 500

# Function to extract text from PDF
def extract_pdf_text(file_path):
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()  # Extract text from each page
    return text.strip()

# Start the Flask app
if __name__ == '__main__':
    # Ensure the uploads folder exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    app.run(debug=True)
