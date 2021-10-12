from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit
import numpy as np
import cv2
import threading
import random

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('my event')
def test_message(message):
    print(message)
    emit('my response', {'data': 'server echoes: ' + str(message['data'])})

@socketio.on('my broadcast event')
def test_message(message):
    # print(message)
    emit('my response', {'data': 'server echoes: ' + str(message['data'])}, broadcast=True)

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
        frame.fill(random.randint(0, 254))
        ret, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/stream')
def stream():
    return Response(threading.start_new_thread(gen_frames), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')