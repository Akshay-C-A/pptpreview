// src/App.js
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './App.css';

// Initialize PDF.js with worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function App() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversionProgress, setConversionProgress] = useState(0);

  // FastAPI backend URL
  const API_URL = 'http://localhost:8000';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.pptx')) {
      setFile(selectedFile);
      setError(null);
      setPdfUrl(null);
    } else {
      setFile(null);
      setError('Please select a valid PowerPoint (.pptx) file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setConversionProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setConversionProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      const response = await fetch(`${API_URL}/convert`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setConversionProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setPdfUrl(`${API_URL}${data.pdf_url}`);
      setPageNumber(1);
    } catch (err) {
      console.error('Error converting file:', err);
      setError(err.message || 'Failed to convert file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <div className="app-container">
      <h1>PowerPoint to PDF Converter</h1>
      <p className="app-description">
        Upload your PowerPoint presentation (.pptx) and convert it to PDF format
      </p>
      
      <div className="upload-section">
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept=".pptx" 
          className="file-input"
          disabled={isLoading}
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || isLoading}
          className="upload-button"
        >
          {isLoading ? 'Converting...' : 'Convert to PDF'}
        </button>
      </div>

      {isLoading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${conversionProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">Converting: {conversionProgress}%</div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {pdfUrl && (
        <div className="pdf-container">
          <div className="pdf-controls">
            <button 
              onClick={previousPage} 
              disabled={pageNumber <= 1}
              className="page-button"
            >
              ← Previous
            </button>
            <span className="page-info">Page {pageNumber} of {numPages}</span>
            <button 
              onClick={nextPage} 
              disabled={pageNumber >= numPages}
              className="page-button"
            >
              Next →
            </button>
          </div>
          
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            error={<div className="pdf-error">Failed to load PDF. Try downloading instead.</div>}
            loading={<div className="pdf-loading">Loading PDF...</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
              scale={1.2}
              className="pdf-page"
            />
          </Document>

          <div className="download-section">
            <a href={pdfUrl} download className="download-button">
              Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;