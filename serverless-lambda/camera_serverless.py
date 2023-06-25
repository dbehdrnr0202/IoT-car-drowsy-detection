
from awscrt import mqtt, http
from awsiot import mqtt_connection_builder
from picamera2 import Picamera2
import cv2
import dlib
from math import hypot
import time
from scipy.spatial import distance
from functools import wraps
import json

lastsave = 0
EAR_THRESHOLD=0.3
FRAME_THRESHOLD=5

msg_topic = "DROWSY"
client = 'camera_serverless'


mqtt_connection = mqtt_connection_builder.mtls_from_path(
	endpoint='a22mz3iyiit10s-ats.iot.ap-southeast-2.amazonaws.com',
	cert_filepath='/home/team7/cert/a8ae8ec42b62b54a64986d5e9244a1f3b28197d602e071d33f4edd7c62763e27-certificate.pem.crt',
	pri_key_filepath='/home/team7/cert/a8ae8ec42b62b54a64986d5e9244a1f3b28197d602e071d33f4edd7c62763e27-private.pem.key',
	ca_filepath='/home/team7/cert/AmazonRootCA1.pem',
	client_id=client)
connect_future = mqtt_connection.connect()

connect_future.result()
print('connected')

def publish(pub_topic, msg_str):
	json_object = {
		'topic':pub_topic,
		'message':msg_str,
		'device':client
	}
	publish_future = mqtt_connection.publish(
		topic=pub_topic,
		payload=json.dumps(json_object),
		qos=mqtt.QoS.AT_LEAST_ONCE
	)
publish(msg_topic, 'test msg DROWSY')
#print('pubed')

detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("./shape_predictor_68_face_landmarks.dat")

cv2.startWindowThread()
picam2 = Picamera2()
picam2.configure(picam2.create_preview_configuration(main={"format": 'XRGB8888', "size": (640, 480)}))
picam2.start()

#EAR 계산
def calculate_EAR(eye): 
	A = distance.euclidean(eye[1], eye[5])
	B = distance.euclidean(eye[2], eye[4])
	C = distance.euclidean(eye[0], eye[3])
	ear_aspect_ratio = (A+B)/(2.0*C)
	return ear_aspect_ratio
	
#눈을 감았을 경우 count 증가, 떳을 경우 count 0으로 초기화
def counter(func):
    @wraps(func)
    def tmp(*args, **kwargs):
        tmp.count += 1
        time.sleep(0.05)
        global lastsave
        if time.time() - lastsave > 5:
            lastsave = time.time()
            tmp.count = 0
        return func(*args, **kwargs)
    tmp.count = 0
    return tmp

#눈을 감았을 경우 camera window 창에 DETECTED 출력
@counter
def close():
    cv2.putText(img,"DETECTED",(20,100), cv2.FONT_HERSHEY_SIMPLEX,3,(0,0,255),4)

while True:
    img = picam2.capture_array()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    for face in faces:
        landmarks = predictor(gray, face)
        leftEye = []
        rightEye = []
        # 오른쪽 눈 감지
        for n in range(36,42): 
        	x = landmarks.part(n).x
        	y = landmarks.part(n).y
        	leftEye.append((x,y))
        	next_point = n+1
        	if n == 41:
        		next_point = 36
        	x2 = landmarks.part(next_point).x
        	y2 = landmarks.part(next_point).y
        	cv2.line(img,(x,y),(x2,y2),(0,255,0),1)
        # 왼쪽 눈 감지
        for n in range(42,48): 
        	x = landmarks.part(n).x
        	y = landmarks.part(n).y
        	rightEye.append((x,y))
        	next_point = n+1
        	if n == 47:
        		next_point = 42
        	x2 = landmarks.part(next_point).x
        	y2 = landmarks.part(next_point).y
        	cv2.line(img,(x,y),(x2,y2),(0,255,0),1)

        left_ear = calculate_EAR(leftEye)
        right_ear = calculate_EAR(rightEye)

        EAR = (left_ear+right_ear)/2
        EAR = round(EAR,2)

        if EAR<EAR_THRESHOLD:
            close()
            print(f'close count : {close.count}')
            #일정 프레임 이상 눈을 감았을 경우 MSG PUBLISH
            if close.count == FRAME_THRESHOLD:
                msg = "DROWSY Detected"
                print(msg)
                publish(msg_topic,msg)
                print('published msg')
        print(EAR)

    cv2.imshow("DETECTING", img)

    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break