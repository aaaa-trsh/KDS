
import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt
import time
from camera import VideoCapture
from cam2floor import *
import matplotlib.pyplot as plt

tri = [0.03, 0.04]
cap = VideoCapture('http://raspberrypi.local:8081/')

plt.ion()
fig = plt.figure()
ax = fig.add_subplot(111)
ax.set_xlim((-60, 1))
ax.set_ylim((30, -30))
ax.plot(0, 0, 'rx')
# ax.plot([0, -100], [0, np.tan(hFOV / 2 * np.pi / 180) * -100], color="red")
# ax.plot([0, -100], [0, np.tan(hFOV / 2 * np.pi / 180) * 100], color="red")
sc = ax.scatter([], [], color="black", alpha=0.2, s=3)
def plotIntersections(points, width, height):
    recalcGlobals(width, height)
    intersections = [intersectFloorPlane(x, y) for x, y in points]
    newOffsets = np.c_[[x/12 for x, y, z in intersections],[y/12 for x, y, z in intersections]]
    if sc.get_offsets() is None:
        sc.set_offsets(newOffsets)
    else:
        sc.set_offsets(np.r_[sc.get_offsets()[-100:], newOffsets])
    fig.canvas.draw()
    fig.canvas.flush_events()

while True:
    read_frame = cap.read()
    print(read_frame.shape)
    img = read_frame #cv.imread('./floordetect/data/frc3.png', 0)
    template = img[int(img.shape[0] - img.shape[0] * tri[1]):, int(img.shape[1]/2 - img.shape[1]*tri[0]):int(img.shape[1]/2 + img.shape[1]*tri[0])]

    img2 = img#cv.copyMakeBorder(img, int(template.shape[0]/2), int(template.shape[0]/2), int(template.shape[1]/2), int(template.shape[1]/2), cv.BORDER_REPLICATE)
    s = time.time()
    res = cv.matchTemplate(img2,template, cv.TM_SQDIFF_NORMED)
    # cv.imshow('res', res)

    res = cv.threshold(res, 0.08, 1, cv.THRESH_BINARY)[1]
    res = ((1-res)*255).astype(np.uint8)
    kernel = np.ones((3,3),np.uint8)
    res = cv.dilate(res,kernel,iterations = 5)
    res = cv.erode(res,kernel,iterations = 3)

    crop = img2[int(img2.shape[0]/2 - res.shape[0]/2): int(img2.shape[0]/2 + res.shape[0]/2), int(img2.shape[1]/2 - res.shape[1]/2): int(img2.shape[1]/2 + res.shape[1]/2)]
    contours, hierarchy = cv.findContours(res, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)

    biggest_contour_mask = np.zeros(res.shape, np.uint8)
    if len(contours) != 0:
        # find the biggest countour (c) by the area
        cv.drawContours(biggest_contour_mask,[max(contours, key = cv.contourArea)],0,255,-1)
    res = biggest_contour_mask

    # find corners of res
    pts = cv.goodFeaturesToTrack(res,50,0.03,40)
    pts = np.int0(pts)
    print("took", time.time() - s, "s")

    pts = sorted([pt.ravel() for pt in pts], key=lambda pt: pt[0])
    for i, (x, y) in enumerate(pts):
        cv.circle(crop,(x,y),3,(255, 255, 255),-1)
        if i == 0:
            continue

    a = cv.bitwise_and(crop, crop, mask=(res*255).astype(np.uint8))
    out = cv.addWeighted(a, 0.8, crop, 0.5, 0)
    out = cv.putText(out, f'Floor Detect - found {len(pts)} trackable points', (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 1, cv.LINE_AA)
    cv.imshow("a", out)
    cv.waitKey(1)

    plotIntersections(pts, crop.shape[1], crop.shape[0])