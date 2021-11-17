from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit
import random
import time
import math
from networktables import NetworkTables
import numpy as np
import cv2
import base64
from camera import VideoCapture
# import floor_seg

NetworkTables.addConnectionListener(lambda connected, info: print(info, "connected=", connected), immediateNotify=True)
# NetworkTables.initialize(server="localhost")
NetworkTables.initialize(server="10.66.44.2")
wsTable = NetworkTables.getTable("testws")
app = Flask(__name__)
socketio = SocketIO(app)
isCam = False
cap = VideoCapture('')#'http://raspberrypi.local:8081/')

sample_rpos = [0, 0, 0]

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("pos")
def send_pos(_):
    global sample_rpos
    if isCam:
        frame = cap.read()
    else:
        frame = np.zeros((1, 1, 3), np.uint8)
    # print(frame.shape)
    _, buffer = cv2.imencode(".jpg", frame)
    emit("pos", {
            "data": str(wsTable.getNumberArray("pos", sample_rpos)).replace("(", "[").replace(")", "]"),
            "img": ""#base64.b64encode(buffer).decode("utf-8")
        }
    )
    sample_rpos = [sample_rpos[0] + math.cos(sample_rpos[2])/20, sample_rpos[1] + math.sin(sample_rpos[2])/20, sample_rpos[2] + (0.5 * (random.random()-0.45))]

@socketio.on("obstacle")
def send_obs(_):
    print("".join(open("./map.in").readlines()))
    emit("obstacle", {"data": "".join(open("./map.in").readlines())})


@socketio.on("path")
def fwd_path(_):
    wsTable.putString("path", _["path"])


@socketio.on("connect")
def test_connect():
    print("Client Connected")

@socketio.on("disconnect")
def test_disconnect():
    print("Client Disconnected")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0")