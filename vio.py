from camera import VideoCapture
import cv2
import threading
import time
from sophus import se3, so3, quaternion, matrix
import numpy as np
from dataclasses import dataclass

class ImageAndExposure:
    def __init__(self, image, timestamp):
        self.image = image
        self.exposure = 1
        self.timestamp = timestamp

    def deepcopy(self):
        return ImageAndExposure(self.image.copy(), self.exposure)
    
    def copyMetaTo(self, other):
        other.exposure = self.exposure

class Undistorter:
    def __init__(self, g, vignetteMap=None):
        self.start = time.time()
        self.g = g
        self.vignetteMap = vignetteMap
    
    def photometricUndistort(self, image, exposure, factor):
        wh = image.shape[0] * image.shape[1]
        output = ImageAndExposure(image, 0)
        if (exposure <= 0):
            output.image = image * factor
        else:
            # use pixel values of image to index g
            # g is a 1D array of size 256
            # also correct for vignette, a 2D image of size (w,h)
            rows,cols=image.shape[:2]
            for i in range(rows):
                for j in range(cols):
                    output.image[i,j] = self.g[image[i,j]]
                    if self.vignetteMap is not None:
                        output.image[i,j] *= self.vignetteMap[i,j]
        output.exposure = exposure
        output.timestamp = 0
        return output

    def applyBlurNoise(self, img, blurSize=0):
        # weird blur stuff, /src/util/Undistort.cpp line 489
        pass

    def undistort(self, image, exposure, timestamp):
        if timestamp == -1:
            timestamp = time.time() - self.start
        photoCalibImage = self.photometricUndistort(image, exposure, 1)
        passthrough = True
        res = ImageAndExposure(image, timestamp)
        res.copyMetaTo(photoCalibImage)

        if not passthrough:
            # weird noise stuff, /src/util/Undistort.cpp line 400
            pass
        else:
            res.image = photoCalibImage.image
        
        # self.applyBlurNoise(res)
        return res

class FrameHessian:
    def __init__(self):
        pass

@dataclass
class FrameShell:
    id: int
    incoming_id: int
    timestamp: float
    
    camToTrackingRef: se3.Se3
    tracking_ref: se3.Se3

class AffLight:
    def __init__(self, a, b):
        self.a = a
        self.b = b
    
    @staticmethod
    def fromToVecExposure(exposureF, exposureT, g2F, g2T):
        if exposureF == 0 or exposureT == 0:
            exposureF = 1
            exposureT = 1
        a = np.exp(g2T.a - g2F.a) * exposureT / exposureF
        b = g2T.b - a * g2F.b
        return np.array([a, b])
    
    def vec(self):
        return np.array([a, b])

class System:
    def __init__(self):
        self.initialized = False
        self.lost = False
        self.allFrameHistory = []
        pass
    def addActiveFrame(self, image, idx):
        # FullSystem.cpp addActiveFrame
        if self.lost:
            return
        fh = FrameHessian()
        shell = FrameShell()
        shell.camToWorld = se3.Se3(so3.So3(quaternion.Quaternion.identity()), matrix.Vector3(0, 0, 0))
        shell.aff_g2l = AffLight(0, 0)
        shell.marginalizedAt = len(self.allFrameHistory)
        shell.id = len(self.allFrameHistory)
        shell.timestamp = image.timestamp
        shell.incoming_id = idx
        fh.shell = shell
        self.allFrameHistory.append(shell)
        
        pass
class Main:
    def __init__(self, img_stream):
        # self.capture = VideoCapture(img_stream)
        self.frame = None
        self.undistorter = Undistorter(list(range(256)))
        # reset velocity, position, and orientation to 0, then accumulate

    def getImage(self, idx):
        return self.undistorter.undistort(self.frames[idx], 1, -1)

    def monoVIO(self, frames):
        for i  in range(len(self.frames)):
            img = self.getImage(i)

            