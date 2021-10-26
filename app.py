from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit
import numpy as np
import cv2
import threading
import random
import time
import math
import time
from networktables import NetworkTables
NetworkTables.addConnectionListener(lambda connected, info: print(info, "connected =", connected), immediateNotify=True)
NetworkTables.initialize(server="roborio-6644-frc.local")

wsTable = NetworkTables.getTable("testws")
app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('pos')
def test_message(message):
    emit('pos', {'data': str(wsTable.getNumberArray("pos", [0, 0]))})
    
@socketio.on('connect')
def test_connect():
    print('Client Connected')
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect')
def test_disconnect():
    print('Client Disconnected')

def gen_frames():
    while True:
        frame = np.zeros((15, 30, 3), np.uint8)
        frame.fill((math.sin(time.time() * 10)+1) * 128)
        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/stream')
def stream():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')