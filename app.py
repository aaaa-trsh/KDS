from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit
import random
import time
import math
from networktables import NetworkTables
import numpy as np
import cv2
import base64

NetworkTables.addConnectionListener(lambda connected, info: print(info, "connected=", connected), immediateNotify=True)
NetworkTables.initialize(server="10.66.44.2")
wsTable = NetworkTables.getTable("testws")
app = Flask(__name__)
socketio = SocketIO(app)

sample_rpos = [0, 0, 0]

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("pos")
def send_pos(_):
    global sample_rpos
    frame = np.zeros((15, 30, 3), np.uint8)
    frame.fill((math.sin(time.time() * 10)+1) * 32)
    ret, buffer = cv2.imencode(".jpg", frame)
    emit("pos", {
            "data": str(wsTable.getNumberArray("pos", sample_rpos)).replace("(", "[").replace(")", "]"),
            "img": base64.b64encode(buffer).decode("utf-8")
        }
    )
    sample_rpos = [sample_rpos[0] + math.cos(sample_rpos[2])/20, sample_rpos[1] + math.sin(sample_rpos[2])/20, sample_rpos[2] + (0.5 * (random.random()-0.45))]

@socketio.on("obstacle")
def send_obs(_):
    print("".join(open("./map.in").readlines()))
    emit("obstacle", {"data": "".join(open("./map.in").readlines())})


@socketio.on("path")
def fwd_path(_):
    print(_)
    wsTable.putString("path", _["path"])


@socketio.on("connect")
def test_connect():
    print("Client Connected")

@socketio.on("disconnect")
def test_disconnect():
    print("Client Disconnected")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0")