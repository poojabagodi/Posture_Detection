import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Play, Pause, AlertTriangle, CheckCircle, Loader, Activity, Eye, Zap } from 'lucide-react';
import "./index.css"
const PostureDetectorApp = () => {
  const [mode, setMode] = useState('upload'); // 'upload' or 'webcam'
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [results, setResults] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [exerciseType, setExerciseType] = useState('squat');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock API base URL - replace with your deployed backend
  const API_BASE_URL = 'http://localhost:5000';

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsRecording(true);
    } catch (err) {
      alert('Error accessing webcam: ' + err.message);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  const processWebcamFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('frame', blob);
      formData.append('exercise_type', exerciseType);

      try {
        const response = await fetch(`${API_BASE_URL}/analyze-frame`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          setResults(result);
        }
      } catch (error) {
        console.error('Error processing frame:', error);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('exercise_type', exerciseType);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-video`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
      } else {
        alert('Error processing video');
      }
    } catch (error) {
      alert('Error connecting to server: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process webcam frames periodically
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(processWebcamFrame, 500); // Process every 500ms
    }
    return () => clearInterval(interval);
  }, [isRecording, exerciseType]);

  const renderPostureAlert = (issues) => {
    if (!issues || issues.length === 0) {
      return (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-400"></div>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 p-3 bg-emerald-100 rounded-full">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <div>
              <h4 className="text-emerald-800 font-bold text-lg">Perfect Posture!</h4>
              <p className="text-emerald-700 text-sm">Your form looks great. Keep it up!</p>
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-emerald-100 rounded-full opacity-30"></div>
        </div>
      );
    }

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-pink-400"></div>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 bg-red-100 rounded-full">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-red-800 font-bold text-lg mb-3">Posture Issues Detected</h4>
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                  <span className="text-red-700 font-medium">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-red-100 rounded-full opacity-30"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <Activity className="text-white" size={32} />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              AI Posture Detector
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Harness the power of AI to perfect your posture with real-time analysis and personalized feedback
            </p>
          </div>

          {/* Exercise Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              Choose Exercise Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExerciseType('squat')}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  exerciseType === 'squat'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-lg transform scale-105'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Zap size={20} />
                  <span className="font-medium">Squat Analysis</span>
                </div>
              </button>
              <button
                onClick={() => setExerciseType('desk')}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  exerciseType === 'desk'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-500 shadow-lg transform scale-105'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Eye size={20} />
                  <span className="font-medium">Desk Posture</span>
                </div>
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                mode === 'upload'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl transform scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <Upload size={24} />
              <span>Upload Video</span>
            </button>
            <button
              onClick={() => setMode('webcam')}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                mode === 'webcam'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl transform scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-lg'
              }`}
            >
              <Camera size={24} />
              <span>Live Webcam</span>
            </button>
          </div>

          {/* Upload Mode */}
          {mode === 'upload' && (
            <div className="mb-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full border-3 border-dashed border-gray-300 rounded-2xl p-16 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 disabled:opacity-50 group"
              >
                <div className="text-center">
                  {isProcessing ? (
                    <>
                      <Loader className="animate-spin mx-auto mb-6 text-blue-500" size={64} />
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-gray-700">Processing your video...</p>
                        <p className="text-gray-500">This may take a moment</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-6 text-gray-400 group-hover:text-blue-500 transition-colors" size={64} />
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-gray-700">Upload Your Video</p>
                        <p className="text-gray-500">Click here or drag and drop your video file</p>
                        <p className="text-sm text-gray-400">Supports MP4, MOV, AVI and more</p>
                      </div>
                    </>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Webcam Mode */}
          {mode === 'webcam' && (
            <div className="mb-8">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">LIVE</span>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={isRecording ? stopWebcam : startWebcam}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${
                      isRecording
                        ? 'bg-red-600 text-white hover:bg-red-700 transform hover:scale-105'
                        : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                    }`}
                  >
                    {isRecording ? <Pause size={24} /> : <Play size={24} />}
                    <span>{isRecording ? 'Stop Analysis' : 'Start Analysis'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Activity className="text-blue-600" size={28} />
                  Analysis Results
                </h3>
                
                {/* Real-time results for webcam */}
                {mode === 'webcam' && results.posture_issues && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 text-gray-700">Live Analysis:</h4>
                    {renderPostureAlert(results.posture_issues)}
                  </div>
                )}

                {/* Video results */}
                {mode === 'upload' && results.frames && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
                          Frame {currentFrame + 1} of {results.frames.length}
                        </span>
                        <span className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded-full">
                          Total Issues: {results.total_issues || 0}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max={results.frames.length - 1}
                          value={currentFrame}
                          onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="absolute -top-8 left-0 right-0 flex justify-between text-xs text-gray-500">
                          <span>Start</span>
                          <span>End</span>
                        </div>
                      </div>
                    </div>
                    
                    {results.frames[currentFrame] && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-700">Frame {currentFrame + 1} Analysis:</h4>
                        {renderPostureAlert(results.frames[currentFrame].issues)}
                      </div>
                    )}
                  </div>
                )}

                {/* Pose landmarks visualization */}
                {results.pose_landmarks && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800">Pose Detection Status</h4>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-100 rounded-full">
                        <CheckCircle className="text-emerald-600" size={20} />
                      </div>
                      <div>
                        <p className="text-blue-700 font-medium">
                          {results.pose_landmarks.length} key points detected
                        </p>
                        <p className="text-blue-600 text-sm">Pose recognition active</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-10 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
            <h3 className="text-2xl font-bold mb-6 text-indigo-800 flex items-center gap-3">
              <Eye className="text-indigo-600" size={28} />
              How to Use
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-bold text-indigo-700 mb-2">🏋️ For Squats:</h4>
                  <p className="text-indigo-600 text-sm">Stand facing the camera and perform squats. The AI will detect if your knees go beyond your toes or if your back angle is incorrect.</p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-bold text-indigo-700 mb-2">💻 For Desk Posture:</h4>
                  <p className="text-indigo-600 text-sm">Sit at your desk facing the camera. The AI will monitor your neck angle and back straightness in real-time.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-bold text-indigo-700 mb-2">📤 Upload Mode:</h4>
                  <p className="text-indigo-600 text-sm">Upload a pre-recorded video for comprehensive frame-by-frame analysis with detailed insights.</p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <h4 className="font-bold text-indigo-700 mb-2">📹 Webcam Mode:</h4>
                  <p className="text-indigo-600 text-sm">Get instant, real-time feedback on your posture as you exercise or work at your desk.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostureDetectorApp;