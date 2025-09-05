# Image to Pencil Sketch Converter

## Overview

This is a full-stack web application that converts uploaded images into pencil sketches. The application consists of a React frontend built with Vite and custom CSS, and a FastAPI backend that handles image processing using OpenCV and PIL. Users can upload images, preview them, convert them to pencil sketches, and download the results.

**Status: ✅ FULLY FUNCTIONAL** - Successfully deployed and tested with real images (August 16, 2025)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 16, 2025 - Application Complete & Working**
- Fixed all Vite configuration issues for Replit deployment
- Resolved CORS and host blocking problems  
- Added proxy configuration for seamless frontend-backend communication
- Removed TailwindCSS dependencies and implemented custom CSS styling
- Fixed PIL Image.LANCZOS compatibility issues
- Successfully tested with multiple image formats (PNG, JPG)
- Application now fully functional with drag-and-drop upload, real-time conversion, and download capability

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite as the build tool
- **Styling**: Tailwind CSS for responsive design and modern UI components
- **State Management**: React hooks (useState, useRef) for local state management
- **Build System**: Vite configured to serve on port 5000 with host binding for container compatibility

### Backend Architecture
- **Framework**: FastAPI for REST API endpoints
- **Image Processing**: PIL (Python Imaging Library) and OpenCV for image manipulation
- **API Design**: RESTful endpoints with proper HTTP response codes
- **Error Handling**: HTTPException for API error responses
- **File Handling**: In-memory processing using BytesIO streams

### Image Processing Pipeline
- **Input Validation**: Accepts various image formats through multipart/form-data
- **Image Optimization**: Automatic downscaling of large images for performance
- **Sketch Algorithm**: 
  - Convert to grayscale
  - Apply inversion and Gaussian blur
  - Use color dodge blending for pencil sketch effect
- **Output Format**: Returns processed images as streaming responses

### Cross-Origin Resource Sharing (CORS)
- Configured to allow frontend-backend communication
- Development-friendly settings with wildcard origins
- Supports both localhost and container-based development

## External Dependencies

### Frontend Dependencies
- **React**: Component-based UI framework
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS & Autoprefixer**: CSS processing and browser compatibility

### Backend Dependencies
- **FastAPI**: Modern Python web framework
- **PIL (Pillow)**: Python imaging library for basic image operations
- **OpenCV (cv2)**: Computer vision library for advanced image processing
- **NumPy**: Numerical computing library for array operations
- **uvicorn**: ASGI server for running FastAPI applications

### Development Environment
- **Node.js**: JavaScript runtime for frontend development
- **Python 3.x**: Backend runtime environment
- **npm**: Package manager for frontend dependencies
- **pip**: Package manager for Python dependencies

The application is designed to run in a containerized environment with clear separation between frontend and backend services, making it suitable for deployment on various platforms including Replit.