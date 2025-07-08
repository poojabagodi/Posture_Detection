from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import tempfile
import os
from werkzeug.utils import secure_filename
import math

app = Flask(__name__)
CORS(app)

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    enable_segmentation=False,
    smooth_segmentation=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
    
    return angle

def get_pose_landmarks(image):
    """Extract pose landmarks from image"""
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_image)
    
    if results.pose_landmarks:
        landmarks = []
        for lm in results.pose_landmarks.landmark:
            landmarks.append([lm.x, lm.y, lm.z])
        return landmarks
    return None

def analyze_squat_posture(landmarks):
    """Analyze squat posture and return issues"""
    issues = []
    
    # Get relevant landmarks
    left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    
    right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
    right_knee = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    
    # Check if knees go beyond toes
    if left_knee[0] > left_ankle[0] + 0.05:  # 5% threshold
        issues.append("Left knee extends too far forward beyond toes")
    
    if right_knee[0] > right_ankle[0] + 0.05:
        issues.append("Right knee extends too far forward beyond toes")
    
    # Check back angle (hip-shoulder-vertical)
    left_back_angle = calculate_angle(
        [left_hip[0], left_hip[1]], 
        [left_shoulder[0], left_shoulder[1]], 
        [left_shoulder[0], left_shoulder[1] - 0.1]
    )
    
    if left_back_angle < 150:  # Back too bent forward
        issues.append(f"Back angle too bent forward ({left_back_angle:.1f}°)")
    
    # Check knee angle for depth
    left_knee_angle = calculate_angle(
        [left_ankle[0], left_ankle[1]],
        [left_knee[0], left_knee[1]],
        [left_hip[0], left_hip[1]]
    )
    
    if left_knee_angle > 120:  # Not squatting deep enough
        issues.append("Squat depth insufficient - go lower")
    
    # Check if knees are caving inward
    knee_distance = abs(left_knee[0] - right_knee[0])
    hip_distance = abs(left_hip[0] - right_hip[0])
    
    if knee_distance < hip_distance * 0.8:  # Knees too close together
        issues.append("Knees caving inward - push knees out")
    
    return issues

def analyze_desk_posture(landmarks):
    """Analyze desk sitting posture and return issues"""
    issues = []
    
    # Get relevant landmarks
    nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    left_ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR.value]
    
    # Check neck angle (forward head posture)
    neck_angle = calculate_angle(
        [left_shoulder[0], left_shoulder[1]],
        [left_ear[0], left_ear[1]],
        [left_ear[0], left_ear[1] - 0.1]
    )
    
    if neck_angle > 30:  # Head too far forward
        issues.append(f"Forward head posture detected ({neck_angle:.1f}°)")
    
    # Check shoulder alignment
    shoulder_slope = abs(left_shoulder[1] - right_shoulder[1])
    if shoulder_slope > 0.05:  # Shoulders not level
        issues.append("Shoulders not level - uneven posture")
    
    # Check back straightness (shoulder-hip alignment)
    avg_shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
    avg_hip_y = (left_hip[1] + right_hip[1]) / 2
    avg_shoulder_x = (left_shoulder[0] + right_shoulder[0]) / 2
    avg_hip_x = (left_hip[0] + right_hip[0]) / 2
    
    # Calculate back angle from vertical
    back_angle = calculate_angle(
        [avg_hip[0], avg_hip[1]],
        [avg_shoulder_x, avg_shoulder_y],
        [avg_shoulder_x, avg_shoulder_y - 0.1]
    )
    
    if back_angle > 20:  # Back too hunched
        issues.append(f"Hunched back detected ({back_angle:.1f}°)")
    
    # Check if head is too low (looking down)
    if nose[1] > left_shoulder[1] + 0.05:
        issues.append("Head position too low - lift your head")
    
    return issues

@app.route('/analyze-frame', methods=['POST'])
def analyze_frame():
    """Analyze a single frame from webcam"""
    try:
        if 'frame' not in request.files:
            return jsonify({'error': 'No frame provided'}), 400
        
        frame_file = request.files['frame']
        exercise_type = request.form.get('exercise_type', 'squat')
        
        # Read image
        file_bytes = np.frombuffer(frame_file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': 'Invalid image format'}), 400
        
        # Get pose landmarks
        landmarks = get_pose_landmarks(image)
        
        if landmarks is None:
            return jsonify({
                'pose_detected': False,
                'posture_issues': ['No pose detected - make sure you are fully visible']
            })
        
        # Analyze posture based on exercise type
        if exercise_type == 'squat':
            issues = analyze_squat_posture(landmarks)
        elif exercise_type == 'desk':
            issues = analyze_desk_posture(landmarks)
        else:
            return jsonify({'error': 'Invalid exercise type'}), 400
        
        return jsonify({
            'pose_detected': True,
            'posture_issues': issues,
            'pose_landmarks': landmarks
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-video', methods=['POST'])
def analyze_video():
    """Analyze an uploaded video file"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video provided'}), 400
        
        video_file = request.files['video']
        exercise_type = request.form.get('exercise_type', 'squat')
        
        # Save video temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            video_file.save(temp_file.name)
            temp_video_path = temp_file.name
        
        # Process video
        cap = cv2.VideoCapture(temp_video_path)
        frames_data = []
        frame_count = 0
        total_issues = 0
        
        while cap.isOpened() and frame_count < 300:  # Limit to 300 frames
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every 10th frame to reduce processing time
            if frame_count % 10 == 0:
                landmarks = get_pose_landmarks(frame)
                
                if landmarks:
                    if exercise_type == 'squat':
                        issues = analyze_squat_posture(landmarks)
                    else:
                        issues = analyze_desk_posture(landmarks)
                    
                    frames_data.append({
                        'frame_number': frame_count,
                        'issues': issues,
                        'pose_detected': True
                    })
                    
                    if issues:
                        total_issues += len(issues)
                else:
                    frames_data.append({
                        'frame_number': frame_count,
                        'issues': ['No pose detected'],
                        'pose_detected': False
                    })
            
            frame_count += 1
        
        cap.release()
        
        # Clean up temp file
        os.unlink(temp_video_path)
        
        return jsonify({
            'total_frames': frame_count,
            'processed_frames': len(frames_data),
            'total_issues': total_issues,
            'frames': frames_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Posture Detection API is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)