# AI Posture Detector

A real-time posture analysis application that uses AI and computer vision to detect and correct posture issues during exercises and desk work. The system provides instant feedback on form and posture using MediaPipe pose estimation.

## Features

- **Real-time Posture Analysis**: Live webcam feed with instant posture feedback
- **Video Upload Analysis**: Upload pre-recorded videos for comprehensive analysis
- **Multiple Exercise Types**: 
  - Squat form analysis
  - Desk posture monitoring
- **Detailed Feedback**: Specific corrections for posture issues
- **Frame-by-frame Analysis**: Detailed breakdown of posture throughout video
- **Modern Web Interface**: Responsive, intuitive UI with real-time visualizations

## Tech Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **MediaPipe** - Pose estimation
- **OpenCV** - Computer vision
- **NumPy** - Mathematical operations

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 14+ and npm
- Webcam (for real-time analysis)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-posture-detector
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install flask flask-cors opencv-python mediapipe numpy werkzeug
   ```

4. **Run the backend server**
   ```bash
   python app.py
   ```
   
   The server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend  # Adjust path as needed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   
   The frontend will be available at `http://localhost:3000`

## Usage

### Exercise Types

#### 1. Squat Analysis
- **Setup**: Stand facing the camera, full body visible
- **Detection**: 
  - Knee alignment (prevents knees going beyond toes)
  - Back angle monitoring
  - Squat depth assessment
  - Knee caving detection

#### 2. Desk Posture Analysis
- **Setup**: Sit at your desk facing the camera
- **Detection**:
  - Forward head posture
  - Shoulder alignment
  - Back straightness
  - Head position relative to shoulders

### Analysis Modes

#### Real-time Webcam Mode
1. Select "Live Webcam" mode
2. Choose exercise type (Squat or Desk)
3. Click "Start Analysis"
4. Grant camera permissions
5. Get instant feedback on posture issues

#### Video Upload Mode
1. Select "Upload Video" mode
2. Choose exercise type
3. Upload your video file (MP4, MOV, AVI supported)
4. Wait for processing
5. Review frame-by-frame analysis with timeline scrubber

## API Endpoints

### `POST /analyze-frame`
Analyzes a single frame from webcam feed.

**Parameters:**
- `frame` (file): Image file from webcam
- `exercise_type` (string): "squat" or "desk"

**Response:**
```json
{
  "pose_detected": true,
  "posture_issues": ["List of detected issues"],
  "pose_landmarks": [[x, y, z], ...]
}
```

### `POST /analyze-video`
Analyzes an uploaded video file.

**Parameters:**
- `video` (file): Video file
- `exercise_type` (string): "squat" or "desk"

**Response:**
```json
{
  "total_frames": 300,
  "processed_frames": 30,
  "total_issues": 15,
  "frames": [
    {
      "frame_number": 0,
      "issues": ["List of issues"],
      "pose_detected": true
    }
  ]
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Posture Detection API is running"
}
```

## Configuration

### Backend Configuration
- **Server**: Runs on `0.0.0.0:5000` by default
- **CORS**: Enabled for frontend integration
- **Frame Processing**: Processes every 10th frame for video analysis
- **Max Frames**: Limited to 300 frames per video to optimize performance

### Frontend Configuration
- **API URL**: Update `API_BASE_URL` in the React component to match your backend URL
- **Webcam Settings**: 640x480 resolution by default
- **Analysis Frequency**: Processes webcam frames every 500ms

## Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure browser permissions are granted
   - Check if other applications are using the camera

2. **Backend Connection Failed**
   - Verify backend is running on the correct port
   - Check CORS configuration
   - Ensure firewall isn't blocking the connection

3. **Poor Pose Detection**
   - Ensure good lighting
   - Full body should be visible for squat analysis
   - Upper body should be visible for desk posture
   - Avoid busy backgrounds

4. **Video Upload Issues**
   - Check file format (MP4, MOV, AVI supported)
   - Ensure video file isn't corrupted
   - Check file size limits

### Performance Optimization

1. **For Real-time Analysis**:
   - Reduce webcam resolution if needed
   - Increase frame processing interval
   - Close other resource-intensive applications

2. **For Video Analysis**:
   - Use shorter video clips for faster processing
   - Reduce video resolution before uploading
   - Process every nth frame instead of all frames

## Development

### Project Structure
```
ai-posture-detector/
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── PostureDetectorApp.jsx
│   ├── package.json
│   └── public/
└── README.md
```

### Adding New Exercise Types

1. **Backend**: Add analysis function in `app.py`
   ```python
   def analyze_new_exercise(landmarks):
       issues = []
       # Add your analysis logic here
       return issues
   ```

2. **Frontend**: Add new exercise option
   ```jsx
   <button onClick={() => setExerciseType('new_exercise')}>
     New Exercise
   </button>
   ```

### Customizing Analysis Parameters

Modify the detection thresholds in `app.py`:
- Angle thresholds for posture detection
- Distance thresholds for alignment
- Confidence levels for pose detection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request



## Acknowledgments

- **MediaPipe** by Google for pose estimation
- **OpenCV** for computer vision capabilities
- **Flask** for the web framework
- **React** for the frontend framework

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing issues in the repository
3. Create a new issue with detailed description and steps to reproduce

---

**Note**: This application is for educational and fitness guidance purposes. Always consult with a fitness professional or healthcare provider for personalized advice.