import cv2
import numpy as np


def distance(p1, p2):
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def conditions(line, vertical, all_points):
    a = np.sqrt((line[0][0] - line[1][0])**2 + (line[0][1] - line[1][1])**2) > 100
    # get angle
    b1 = abs(np.arctan2(line[1][1] - line[0][1], line[1][0] - line[0][0])) > np.pi / 180 * 65
    b2 = any(
        distance(line[0], p) > 60 or
        distance(line[1], p) > 60
        for p in all_points
    )
    
    c = any(
        distance(line[0], v[0]) > 45 or
        distance(line[1], v[0]) > 45
        for v in vertical
    )

    return a or (b1 and b2) or c

# get the floor from a grayscale image
def get_floor(base, floor_level=50):  # sourcery no-metrics
    # resize img to 640x400
    base = cv2.resize(base, (640, 400))
    img = base.copy()
    canny = cv2.Canny(img, 70, 150)
    cv2.imshow('canny', canny)
    # cv2.waitKey(0) 
    
    # detect lines
    lines = cv2.HoughLinesP(canny, 1, np.pi/180, 30, minLineLength=20, maxLineGap=30)
    if lines is None:
        return None
    
    horizontal = []
    vertical = []

    cv2.line(img, (0, floor_level), (640, floor_level), (127, 0, 0), 1)
    
    # draw lines
    for line in lines:
        x1, y1, x2, y2 = line[0]
        # max y = 0, min y = 1
        points = [[x1, y1], [x2, y2]] if y2 > y1 else [[x2, y2], [x1, y1]]

        if not (points[0][1] > floor_level or (points[1][1] > floor_level and points[0][1] < floor_level)):
            continue

        if (points[1][1] > floor_level and points[0][1] < floor_level):
            # crop line to be at 200 and follow slope
            slope = (points[1][0] - points[0][0]) / (points[1][1] - points[0][1])
            points[0][0] = int(points[0][0] - (points[0][1] - floor_level) * slope)
            points[0][1] = floor_level
            


        angle = np.arctan2(y2-y1, x2-x1)
        # draw if line is horizontal
        if abs(angle) < np.pi / 180 * 65:
            cv2.line(img, tuple(points[0]), tuple(points[1]), (0, 0, 255), 2)
            horizontal.append(points)

        # draw if line is vertical
        if abs(angle) - np.pi / 4 > np.pi / 180 * 10:
            cv2.line(img, tuple(points[0]), tuple(points[1]), (255, 0, 255), 2)
            vertical.append(points)

    cv2.imshow('lines', img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    # all_lines = sorted(horizontal + vertical, key=lambda l: l[0][0])
    # all_points = []
    # for l in all_lines:
    #     all_points.append(l[0])
    #     all_points.append(l[1])
    
    # find the leftmost point out of horizontal and vertical points
    polyline = []
    while True:
        img = cv2.cvtColor(base, cv2.COLOR_GRAY2BGR)
        all_points = []
        for l in horizontal + vertical:
            all_points.append([l[0], l[1]])
            all_points.append([l[1], l[0]])
        leftmost = min(all_points, key=lambda p: (p[0][1]/2) + p[0][0])
        polyline.append(max(leftmost, key=lambda p: p[1]))
        # polyline.append(max(leftmost, key=lambda p: p[0]))
        for line in horizontal + vertical:
            cv2.line(img, tuple(line[0]), tuple(line[1]), (0, 0, 0), 1)
        #circle leftmost
        cv2.circle(img, tuple(leftmost[0]), 5, (0, 255, 255), -1)
        cv2.line(img, tuple(leftmost[0]), tuple(leftmost[1]), (255, 0, 0), 1)
        # cv2.imshow('lines', img)
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()

        img = cv2.cvtColor(base, cv2.COLOR_GRAY2BGR)
        # remove horizontal lines that are left of leftmost[1]
        horizontal = [l for l in horizontal if l[1][0] > leftmost[1][0]]
        # remove vertical lines that are left of leftmost[1]
        vertical = [l for l in vertical if l[1][0] > leftmost[1][0]]
        for line in horizontal + vertical:
            cv2.line(img, tuple(line[0]), tuple(line[1]), (0, 0, 0), 1)
        cv2.line(img, [leftmost[1][0], 0], [leftmost[1][0], 400], (0, 0, 255), 1)
        # cv2.imshow('lines', img)
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()

        img = cv2.cvtColor(base, cv2.COLOR_GRAY2BGR)
        print(len(polyline))
        for i in range(len(polyline) - 1):
            cv2.line(img, tuple(polyline[i]), tuple(polyline[i + 1]), (0, 0, 0), 1)
        cv2.imshow('lines', img)
        cv2.waitKey(200)
        cv2.destroyAllWindows()
    # polyline = [leftmost[0]]
    # last = leftmost
    # first = True
    # for line in all_lines:  
    #     if first:
    #         first = False
    #         if leftmost[1]: # horizontal
    #             if conditions(line, vertical, all_points):
    #                 polyline.append(line[0])
    #                 polyline.append(line[1])
    #                 last = line[1]
    #                 for l in horizontal:
    #                     # remove all lines to the left of last
    #                     if l[0][0] < last[0] and l[1][0] < last[0]:
    #                         horizontal.remove(l)
    #                     # reset leftmost point of l to last x
    #                     if l[0][0] < last[0] != l[1][0] < last[0]:
    #                         if l[0][0] < last[0]:
    #                             l[0][0] = last[0]
    #                         else:
    #                             l[1][0] = last[0]
    #                 # remove this line from all_lines
    #                 all_lines.remove(line)
    #         else: # vertical
    #             polyline.append(line[0])
    #             polyline.append(line[1])
    #             last = line[1]
    #             all_lines.remove(line)
    #             # go to top
    #     else:
    #         pass



get_floor(cv2.imread('C:/Users/kieth/Documents/GitHub/KDS/floordetect/data/hallway.PNG', 0))
# cv2.imshow('floor', cv2.imread('C:/Users/kieth/Documents/GitHub/KDS/floordetect/data/hallway.PNG', 0))
# cv2.waitKey(0)