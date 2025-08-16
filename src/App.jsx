import { useState, useRef, useCallback } from "react";

// Get API base URL from environment variables with fallback
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function App() {
  // State management
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [resultURL, setResultURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  // Validate file type and size
  const validateFile = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return "Please choose a JPG, PNG, or WEBP image.";
    }
    
    if (file.size > maxSize) {
      return "File too large. Maximum size is 10MB.";
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError("");
    setFile(selectedFile);
    setPreviewURL(URL.createObjectURL(selectedFile));
    setResultURL("");
  }, []);

  // File input change handler
  const onSelectFile = (e) => {
    const selectedFile = e.target.files?.[0];
    handleFileSelect(selectedFile);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Convert image to pencil sketch
  const onConvert = async () => {
    if (!file) return;
    
    setLoading(true);
    setError("");
    setResultURL("");
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch(`${API_BASE}/api/convert`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = "Conversion failed. Please try again.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
        throw new Error(errorMessage);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultURL(url);
      
    } catch (err) {
      console.error("Conversion error:", err);
      setError(err.message || "An unexpected error occurred during conversion.");
    } finally {
      setLoading(false);
    }
  };

  // Reset all state
  const onReset = () => {
    setFile(null);
    setPreviewURL("");
    setResultURL("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download the result image
  const onDownload = () => {
    if (!resultURL) return;
    
    const link = document.createElement("a");
    link.href = resultURL;
    link.download = `pencil-sketch-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '2.5rem' }}>✏️</span>
          <h1 className="title">Image ➜ Pencil Sketch</h1>
        </div>
        <p className="subtitle">
          Transform your photos into stunning pencil sketches with AI-powered image processing. 
          Upload, convert, and download professional-quality artistic renditions.
        </p>
      </header>

      <div className="grid">
        {/* Original Image Panel */}
        <div className="card">
          <h2 className="card-title">
            <span className="status-dot dot-blue"></span>
            Original Image
          </h2>

          {!previewURL ? (
            <div
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onSelectFile}
              />
              <div className="upload-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                  />
                </svg>
              </div>
              <p className="upload-text">
                {dragActive ? "Drop your image here" : "Click to choose an image"}
              </p>
              <p className="upload-subtext">or drag and drop</p>
              <p className="upload-subtext" style={{ marginTop: '8px' }}>
                JPG, PNG, WEBP • Max 10MB
              </p>
            </div>
          ) : (
            <div>
              <div className="image-preview">
                <img src={previewURL} alt="Original" />
              </div>
              <div className="file-info">
                <p>File: {file?.name}</p>
                <p>Size: {file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB</p>
              </div>
            </div>
          )}

          <div className="button-group">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-primary"
              disabled={loading}
            >
              {previewURL ? "Change Image" : "Choose Image"}
            </button>
            
            {previewURL && (
              <>
                <button
                  onClick={onReset}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  onClick={onConvert}
                  disabled={!file || loading}
                  className="btn btn-success"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Converting...
                    </>
                  ) : (
                    "Convert to Sketch"
                  )}
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div className="card">
          <h2 className="card-title">
            <span className="status-dot dot-green"></span>
            Pencil Sketch
          </h2>
          
          {resultURL ? (
            <div>
              <div className="image-preview">
                <img src={resultURL} alt="Pencil Sketch" />
              </div>
              <button onClick={onDownload} className="btn btn-download">
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PNG
              </button>
            </div>
          ) : (
            <div className="result-placeholder">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Generating your pencil sketch...</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>This may take a few moments</p>
                </div>
              ) : (
                <div>
                  <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#475569' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p>Your pencil sketch will appear here</p>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '8px' }}>Upload an image and click convert to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>
          Built with React + FastAPI + OpenCV • 
          <span style={{ margin: '0 8px' }}>•</span>
          Powered by advanced image processing algorithms
        </p>
      </footer>
    </div>
  );
}
