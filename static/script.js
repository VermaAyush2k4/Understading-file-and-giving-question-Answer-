// Event listener for file upload
document.getElementById('fileInput').addEventListener('change', handleFileUpload, false);

let extractedSentences = [];

// Handle the uploaded PDF file
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        extractPdfContent(file);
    } else {
        alert('Please upload a valid PDF file.');
    }
}

// Extract text content from the uploaded PDF
function extractPdfContent(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const typedarray = new Uint8Array(event.target.result);

        // Load PDF with PDF.js
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            let numPages = pdf.numPages;
            let pagePromises = [];

            for (let i = 1; i <= numPages; i++) {
                pagePromises.push(pdf.getPage(i).then(page => {
                    return page.getTextContent().then(textContent => {
                        processTextContent(textContent);
                    });
                }));
            }

            Promise.all(pagePromises).then(() => {
                displayExtractedSentences();
            });
        }).catch(error => {
            console.error('Error loading PDF:', error);
        });
    };

    reader.readAsArrayBuffer(file);
}

// Process the text content of each page
function processTextContent(textContent) {
    const textItems = textContent.items;
    let pageText = '';

    textItems.forEach(item => {
        pageText += item.str + ' ';
    });

    // Split text into sentences
    const sentences = pageText.split('. ').map(sentence => sentence.trim() + '.');

    extractedSentences = [...extractedSentences, ...sentences];
}

// Display the extracted sentences
function displayExtractedSentences() {
    const sentenceList = document.getElementById('sentenceList');
    sentenceList.innerHTML = '';

    extractedSentences.forEach(sentence => {
        const listItem = document.createElement('li');
        listItem.textContent = sentence;
        sentenceList.appendChild(listItem);
    });

    // Display the entire PDF content in the content div
    const pdfContentDiv = document.getElementById('pdfContent');
    pdfContentDiv.textContent = extractedSentences.join('\n');
}

// Handle the question and answer functionality
async function answerQuestion() {
    const question = document.getElementById('questionInput').value.toLowerCase().trim();
    const answerOutput = document.getElementById('answerOutput');

    if (!question) {
        answerOutput.textContent = 'Please type a question.';
        return;
    }

    // Send the question and extracted PDF content to the backend API
    const response = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: question,
            context: extractedSentences.join(' ') // Send all extracted sentences as context
        })
    });

    const data = await response.json();


    // Display the answer
    if (data.answer) {
        answerOutput.textContent = 'Answer: ' + data.answer;
    } else {
        answerOutput.textContent = 'We could find such information.';
    }
}