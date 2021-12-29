import numpy as np

IMG_WIDTH = 640
IMG_HEIGHT = 400
hFOV = 118 # degrees
CAM_HEIGHT = 30 # inches

aspectRatio = IMG_WIDTH / IMG_HEIGHT
vFOV = hFOV / aspectRatio

def recalcGlobals(width, height):
    global IMG_WIDTH, IMG_HEIGHT, hFOV, vFOV, aspectRatio, CAM_HEIGHT
    IMG_WIDTH = width
    IMG_HEIGHT = height
    hFOV = 118 # degrees

    aspectRatio = IMG_WIDTH / IMG_HEIGHT
    vFOV = hFOV / aspectRatio
    
def intersectFloorPlane(px, py):
    px = (px/IMG_WIDTH) * 2 - 1
    py = (py/IMG_HEIGHT) * 2 - 1
    
    # convert to radians
    ax = px * (hFOV / 2) * np.pi / 180
    ay = py * (vFOV / 2) * np.pi / 180

    y = lambda x: np.tan(ax) * x
    z = lambda x: np.tan(ay) * x + CAM_HEIGHT
    
    # find x for z = 0
    # 0 = tan(ay) * x + CAM_HEIGHT
    # -CAM_HEIGHT/tan(ay) = x
    x = -CAM_HEIGHT / np.tan(ay)
    # if x > 0:
    #     return (-1, -1, -1)
    return (x, y(x), z(x))
