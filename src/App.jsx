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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-black text-white">
      <div className="min-h-screen p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-4xl">✏️</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                Image ➜ Pencil Sketch
              </h1>
            </div>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Transform your photos into stunning pencil sketches with AI-powered image processing. 
              Upload, convert, and download professional-quality artistic renditions.
            </p>
          </header>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Original Image Panel */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                Original Image
              </h2>

              {!previewURL ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-200 ${
                    dragActive 
                      ? "border-blue-400 bg-blue-400/10" 
                      : "border-white/30 hover:border-white/60 hover:bg-white/5"
                  }`}
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
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-slate-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1} 
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                        />
                      </svg>
                    </div>
                    <p className="text-slate-300 text-lg font-medium mb-2">
                      {dragActive ? "Drop your image here" : "Click to choose an image"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      or drag and drop
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      JPG, PNG, WEBP • Max 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-800/50">
                    <img 
                      src={previewURL} 
                      alt="Original" 
                      className="w-full h-auto object-contain max-h-96 fade-in" 
                    />
                  </div>
                  <div className="text-sm text-slate-400">
                    <p>File: {file?.name}</p>
                    <p>Size: {file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                  disabled={loading}
                >
                  {previewURL ? "Change Image" : "Choose Image"}
                </button>
                
                {previewURL && (
                  <>
                    <button
                      onClick={onReset}
                      className="btn-secondary"
                      disabled={loading}
                    >
                      Reset
                    </button>
                    <button
                      onClick={onConvert}
                      disabled={!file || loading}
                      className="btn-success flex-1 sm:flex-none"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Converting...
                        </span>
                      ) : (
                        "Convert to Sketch"
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Result Panel */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Pencil Sketch
              </h2>
              
              {resultURL ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-800/50">
                    <img 
                      src={resultURL} 
                      alt="Pencil Sketch" 
                      className="w-full h-auto object-contain max-h-96 fade-in" 
                    />
                  </div>
                  <button
                    onClick={onDownload}
                    className="btn-download w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PNG
                    </span>
                  </button>
                </div>
              ) : (
                <div className="h-64 sm:h-80 flex items-center justify-center text-slate-400 border border-white/10 rounded-xl bg-slate-800/20">
                  <div className="text-center">
                    {loading ? (
                      <div className="space-y-4">
                        <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                        <p className="animate-pulse-slow">Generating your pencil sketch...</p>
                        <p className="text-sm text-slate-500">This may take a few moments</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-16 h-16 mx-auto text-slate-600">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p>Your pencil sketch will appear here</p>
                        <p className="text-sm text-slate-500">Upload an image and click convert to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-slate-400 mt-12 py-6 border-t border-white/10">
            <p className="text-sm">
              Built with React + FastAPI + OpenCV • 
              <span className="mx-2">•</span>
              Powered by advanced image processing algorithms
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
