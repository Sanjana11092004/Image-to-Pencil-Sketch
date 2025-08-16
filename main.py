from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from PIL import Image, ImageOps
import numpy as np
import cv2
import io
import os

app = FastAPI(title="Pencil Sketch API", version="1.0.0")

# CORS configuration - allow frontend access
origins = [
    "http://localhost:5000",  # Vite dev server on port 5000
    "http://127.0.0.1:5000",
    "http://localhost:5173",  # Alternative Vite port
    "http://127.0.0.1:5173",
    "*"  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Pencil Sketch API is running", "status": "ok"}

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "pencil-sketch-api"}

def to_sketch(pil_image: Image.Image) -> Image.Image:
    """
    Convert an RGB PIL image to a pencil-sketch PIL image using OpenCV.
    
    This function implements the classic pencil sketch algorithm:
    1. Convert to grayscale
    2. Invert the colors
    3. Apply Gaussian blur to the inverted image
    4. Use color dodge blending to create the sketch effect
    """
    try:
        # Fix orientation (EXIF) and ensure RGB format
        img = ImageOps.exif_transpose(pil_image).convert("RGB")

        # Optional: Downscale very large images for performance (max dimension 1600px)
        max_dim = 1600
        w, h = img.size
        if max(w, h) > max_dim:
            scale = max_dim / float(max(w, h))
            new_w = int(w * scale)
            new_h = int(h * scale)
            try:
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            except AttributeError:
                img = img.resize((new_w, new_h), Image.LANCZOS)

        # Convert PIL image to numpy array (RGB format)
        rgb_array = np.array(img)

        # Convert RGB to grayscale using OpenCV
        gray = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2GRAY)

        # Invert the grayscale image
        inverted = 255 - gray

        # Apply Gaussian blur to the inverted image
        # Larger kernel size creates softer, more artistic sketches
        blurred = cv2.GaussianBlur(inverted, ksize=(21, 21), sigmaX=0, sigmaY=0)

        # Color dodge blend: blend the grayscale image with the blurred inverted image
        # This creates the pencil sketch effect by highlighting edges and details
        # Using scale=256 to maintain proper brightness levels
        sketch = cv2.divide(gray, 255 - blurred, scale=256.0)

        # Convert back to RGB format for consistent output
        sketch_rgb = cv2.cvtColor(sketch, cv2.COLOR_GRAY2RGB)
        
        # Convert numpy array back to PIL Image
        output_image = Image.fromarray(sketch_rgb)
        
        return output_image
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/api/convert")
async def convert_to_sketch(image: UploadFile = File(...)):
    """
    Convert an uploaded image to a pencil sketch.
    
    Accepts: JPG, PNG, WEBP images up to 10MB
    Returns: PNG image as streaming response
    """
    # Validate content type
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload a JPG, PNG, or WEBP image."
        )

    # Read and validate file size (10MB limit)
    try:
        content = await image.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file.")
    
    max_size = 10 * 1024 * 1024  # 10MB in bytes
    if len(content) > max_size:
        raise HTTPException(
            status_code=413, 
            detail="File too large. Maximum size is 10MB."
        )

    # Validate and open image with PIL
    try:
        pil_image = Image.open(io.BytesIO(content))
        # Verify it's a valid image by trying to load it
        pil_image.verify()
        # Reopen for processing (verify() closes the image)
        pil_image = Image.open(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail="Invalid image file. Please upload a valid image."
        )

    # Process the image to create pencil sketch
    try:
        sketch_image = to_sketch(pil_image)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Image processing failed: {str(e)}"
        )

    # Convert result to PNG and return as streaming response
    try:
        output_buffer = io.BytesIO()
        sketch_image.save(output_buffer, format="PNG", optimize=True)
        output_buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output_buffer.read()), 
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=pencil-sketch.png"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate output image: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
