
import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt
import time
tri = [0.03, 0.04]

img = cv.imread('./floordetect/data/frc3.png', 0)
template = img[int(img.shape[0] - img.shape[0] * tri[1]):, int(img.shape[1]/2 - img.shape[1]*tri[0]):int(img.shape[1]/2 + img.shape[1]*tri[0])]

img2 = img#cv.copyMakeBorder(img, int(template.shape[0]/2), int(template.shape[0]/2), int(template.shape[1]/2), int(template.shape[1]/2), cv.BORDER_REPLICATE)
s = time.time()
res = cv.matchTemplate(img2,template, cv.TM_SQDIFF_NORMED)
# cv.imshow('res', res)

res = cv.threshold(res, 0.01, 1, cv.THRESH_BINARY)[1]
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
    cv.circle(crop,(x,y),3,255,-1)
    if i == 0:
        continue

a = cv.bitwise_and(crop, crop, mask=(res*255).astype(np.uint8))
out = cv.addWeighted(a, 0.8, crop, 0.5, 0)
out = cv.putText(out, f'Floor Detect - found {len(pts)} trackable points', (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1, 255, 1, cv.LINE_AA)
cv.imshow("a", out)
cv.waitKey(0)