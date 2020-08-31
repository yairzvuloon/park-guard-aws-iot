# USAGE
# python3 car_tracker.py --conf config/config.json --lines config/lines_offset_config.json

import argparse
import concurrent.futures
import os
import time
from datetime import datetime

import cv2
import dlib
import imutils
import numpy as np
from imutils.video import FPS
from imutils.video import VideoStream

from alarm_handler import AlarmHandler
from license_plate_handler import handle_plate_identifier
# import the necessary packages
from pyimagesearch.centroidtracker import CentroidTracker
from pyimagesearch.trackableobject import TrackableObject
from pyimagesearch.utils import Conf


def crop_frame(inputBoundingBox, inputFrame):
    # crop car out of frame
    startCropY = inputBoundingBox[1] if inputBoundingBox[1] > 0 else 0
    startCropX = inputBoundingBox[0] if inputBoundingBox[0] > 0 else 0
    crop = inputFrame[startCropY:inputBoundingBox[3],
                      startCropX:inputBoundingBox[2]]
    return crop


def draw_lines(leftToRightLine, rightToLeftLine, horizontalLine, frame, frameHeight, frameWidth):
    cv2.line(frame, (leftToRightLine, 0),
             (leftToRightLine, frameHeight), (0, 255, 255), 2)
    cv2.line(frame, (rightToLeftLine, 0),
             (rightToLeftLine, frameHeight), (0, 255, 255), 2)
    cv2.line(frame, (0, horizontalLine),
             (frameWidth, horizontalLine), (0, 255, 255), 2)


def has_moved(centroids, movementThreshold, centroid):
    y = [c[0] for c in centroids]
    x = [c[1] for c in centroids]
    directionY = centroid[0] - np.mean(y)  # left-right
    directionX = centroid[1] - np.mean(x)  # up-down
    if directionX > movementThreshold or directionX < -1 * movementThreshold or \
            directionY > movementThreshold or directionY < -1 * movementThreshold:
        return True
    return False


def get_license_plate_number(plateInput):
    currentLicenseNumber = plateInput['licenseNumber']
    croppedFrame = crop_frame(
        inputFrame=plateInput['frame'], inputBoundingBox=plateInput['boundingBox'])
    licenseeNumber = handle_plate_identifier(
        croppedFrame=croppedFrame, accessToken=conf["plate_recogniser_token"],
        objectID=plateInput['objectID'], score=conf["recogniser_score"],
        regions=conf["plate_regions"]) if not currentLicenseNumber else currentLicenseNumber

    return plateInput['objectID'], licenseeNumber


def handle_license_plates_in_frame(plateInputs, trackableObjectsList, frameCount):
    if conf["use__plate_recogniser"] and plateInputs and frameCount % conf["plate_recogniser_skip"] == 0:
        with concurrent.futures.ProcessPoolExecutor() as executor:
            results = executor.map(get_license_plate_number, plateInputs)

            for result in results:
                trackableObjectsList[result[0]].licenseNumber = result[1]


def stop_alarm_for_dissappeared_object(inputAlarmThread, inputObjectsList):
    if inputAlarmThread.objectID is not None and inputAlarmThread.stopped is False:
        if inputAlarmThread.objectID not in inputObjectsList:
            print("[INFO] stopped alarm for disappeared object ID {}".format(
                inputAlarmThread.objectID))
            inputAlarmThread.stop()


def get_frame_from_video_stream(videoStream):
    if conf["read_from_video"]:
        ret, frame = videoStream.read()
    else:
        frame = videoStream.read()

    return frame


def obtain_detections_in_frame(frame, network):
    # convert the frame to a blob and pass the blob through the
    # network and obtain the detections
    blob = cv2.dnn.blobFromImage(frame, size=(300, 300),
                                 ddepth=cv2.CV_8U)
    network.setInput(blob, scalefactor=1.0 / 127.5, mean=[127.5,
                                                          127.5, 127.5])
    detections = network.forward()

    return detections


def build_trackers_list_from_detections(detections, rgb, H, W):
    # initialize our new set of object trackers
    trackers = []
    # loop over the detections
    for i in np.arange(0, detections.shape[2]):
        # extract the confidence (i.e., probability) associated
        # with the prediction
        confidence = detections[0, 0, i, 2]

        # filter out weak detections by ensuring the `confidence`
        # is greater than the minimum confidence
        if confidence > conf["confidence"]:
            # extract the index of the class label from the
            # detections list
            idx = int(detections[0, 0, i, 1])

            # if the class label is not a car, ignore it
            if CLASSES[idx] != "car":
                continue

            # compute the (x, y)-coordinates of the bounding box
            # for the object
            box = detections[0, 0, i, 3:7] * np.array([W, H, W, H])
            (startX, startY, endX, endY) = box.astype("int")

            # construct a dlib rectangle object from the bounding
            # box coordinates and then start the dlib correlation
            # tracker
            tracker = dlib.correlation_tracker()
            rect = dlib.rectangle(startX, startY, endX, endY)
            tracker.start_track(rgb, rect)

            # add the tracker to our list of trackers so we can
            # utilize it during skip frames
            trackers.append(tracker)
    return trackers


def build_bounding_box_list_from_trackers_list(trackers, rgb):
    boundingBoxes = []
    # loop over the trackers
    for tracker in trackers:
        # update the tracker and grab the updated position
        tracker.update(rgb)
        pos = tracker.get_position()

        # unpack the position object
        startX = int(pos.left())
        startY = int(pos.top())
        endX = int(pos.right())
        endY = int(pos.bottom())

        # add the bounding box coordinates to the rectangles list
        boundingBoxes.append((startX, startY, endX, endY))

    return boundingBoxes


def calculate_zone_boundaries(H, W, lines_offset_conf):
    LeftToRightLine = W // conf["left_to_right_line"] + \
        lines_offset_conf["left_vertical_offset"]
    RightToLeftLine = W - \
        W // conf["left_to_right_line"] + \
        lines_offset_conf["right_vertical_offset"]
    HorizontalLine = H // conf["horizontal_line"] + \
        lines_offset_conf["horizontal_offset"]

    return LeftToRightLine, RightToLeftLine, HorizontalLine


def draw_information_on_object(currentFrame, centroid, objectID, currentTrackableObject, trackingBoundingBox):
    # draw both the ID of the object, timer and the centroid of the
    # object on the output frame
    text = "ID {} {:.2f} {}".format(objectID, currentTrackableObject.elapsedTime,
                                    currentTrackableObject.licenseNumber)
    cv2.putText(currentFrame, text, (centroid[0] - 10, centroid[1] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, currentTrackableObject.markerColor, 2)
    cv2.circle(currentFrame, (centroid[0], centroid[1]), 4,
               currentTrackableObject.markerColor, -1)
    # draw rectangle around object
    cv2.rectangle(currentFrame, (trackingBoundingBox[0], trackingBoundingBox[1]),
                  (trackingBoundingBox[2], trackingBoundingBox[3]), currentTrackableObject.markerColor)


def create_trackable_object(RightToLeftLine, LeftToRightLine, HorizontalLine, centroid, objectID):
    trackableObject = TrackableObject(objectID, centroid)
    trackableObject.elapsedTime = 0
    # if first centroid is in illegal zone mark it as created in illegal zone
    if RightToLeftLine > centroid[0] > LeftToRightLine and centroid[1] > HorizontalLine:
        trackableObject.createdInIllegalZone = True
        print("[INFO] ID {} created in illegal zone".format(objectID))
    return trackableObject


def append_license_input_info_to_inputs_list(trackableObject, licenseNumberInputs, objectID, cleanFrame,
                                             trackingBoundingBox):
    # if trackable object has no registered licence number
    # add objects details to license inputs list
    if not trackableObject.licenseNumber:
        licenseInput = {'frame': cleanFrame, 'boundingBox': trackingBoundingBox,
                        'licenseNumber': trackableObject.licenseNumber, 'objectID': objectID}
        licenseNumberInputs.append(licenseInput)
    # if created in illegal zone and moved


def check_and_handle_objects_location_in_frame(trackableObject, rightToLeftLine, leftToRightLine, horizontalLine,
                                               objectID, centroid, cleanFrame, infoFrame, alarmThread):
    # if created in illegal zone and moved
    # treat it as if just entered illegal zone
    if trackableObject.createdInIllegalZone and has_moved(trackableObject.centroids, conf["movement_threshold"],
                                                          centroid):
        trackableObject.createdInIllegalZone = False
        print("[INFO] ID {} created in illegal zone now moved".format(objectID))

    # if centroid did not pass the lines and wasn't created inside the illegal zone
    if not trackableObject.passedTheLine and not trackableObject.createdInIllegalZone:
        # check if centroid over the lines
        if rightToLeftLine > centroid[0] > leftToRightLine and centroid[1] > horizontalLine:
            trackableObject.handle_enter_illegal_zone(time.time())

    # otherwise if it passed the lines and wasn't created in illegal zone
    elif not trackableObject.createdInIllegalZone:
        # start calculating elapsed time in illegal zone
        trackableObject.elapsedTime = time.time() - trackableObject.startTime
        # if centroid is out of illegal zone
        if centroid[0] < leftToRightLine or centroid[0] > rightToLeftLine or centroid[1] < horizontalLine:
            trackableObject.handle_returning_to_legal_zone(isAlarmFeatureOn=conf["enable_alarm"],
                                                           isReportFeatureOn=conf["upload_report"])
        # if time in illegal zone did not pass
        if not trackableObject.isBlocking:
            # check to see if the object passed permitted time
            if trackableObject.elapsedTime > conf["time_limit"]:
                frameToUpload = cleanFrame if conf["upload_clean_frame"] else infoFrame
                trackableObject.handle_time_passed(alarmThread=alarmThread, frame=frameToUpload,
                                                   isAlarmFeatureOn=conf["enable_alarm"],
                                                   isReportFeatureOn=conf["upload_report"],
                                                   whiteList=get_white_list())


def get_white_list():
    return Conf(conf["white_list_json"])["list"]


def display_frame(farme):
    # if the *display* flag is set, then display the current frame
    # to the screen and record if a user presses a key
    if conf["display"]:
        cv2.imshow("frame", farme)
        key = cv2.waitKey(1) & 0xFF

        # if the `q` key is pressed, break from the loop
        if key == ord("q"):
            return False
    return True


def end_program(fps, videoStream, alarmThread):
    # stop the timer and display FPS information
    fps.stop()
    print_fps_info(fps)

    # close any open windows
    cv2.destroyAllWindows()
    # clean up
    clean_up_threads(videoStream, alarmThread)


def print_fps_info(fps):
    print("[INFO] elapsed time: {:.2f}".format(fps.elapsed()))
    print("[INFO] approx. FPS: {:.2f}".format(fps.fps()))


def clean_up_threads(videoStream, alarmThread):
    # clean up
    print("[INFO] cleaning up...")
    time.sleep(2.0)
    if conf["read_from_video"]:
        videoStream.release()
    else:
        videoStream.stop()
    time.sleep(2.0)
    alarmThread.stop()
    print("[INFO] Goodbye dear")


def get_input_arguments():
    # construct the argument parser and parse the arguments
    argumentParser = argparse.ArgumentParser()
    argumentParser.add_argument("-c", "--conf", required=True,
                                help="Path to the input configuration file")
    argumentParser.add_argument("-l", "--lines", required=True,
                                help="Path to the input lines offset configuration file")
    args = vars(argumentParser.parse_args())
    return args


def initialize_video_stream():
    # initialize the video stream and allow the camera sensor to warmup
    print("[INFO] warming up camera...")
    if conf["read_from_video"]:
        videoStream = cv2.VideoCapture(conf["video_source"])
    else:
        videoStream = VideoStream(usePiCamera=False).start()
    time.sleep(2.0)
    return videoStream


def run_program():
    # load our serialized model from disk
    print("[INFO] loading model...")
    network = cv2.dnn.readNetFromCaffe(
        conf["prototxt_path"], conf["model_path"])
    # network.setPreferableTarget(cv2.dnn.DNN_TARGET_MYRIAD)

    videoStream = initialize_video_stream()

    # construct alarm thread
    alarmThread = AlarmHandler(src=conf["alarm_source"])

    # initialize the frame dimensions (we'll set them as soon as we read
    # the first frame from the video)
    H = None
    W = None

    # instantiate our centroid tracker, then initialize a list to store
    # each of our dlib correlation trackers, followed by a dictionary to
    # map each unique object ID to a TrackableObject
    centroidTracker = CentroidTracker(maxDisappeared=conf["max_disappear"],
                                      maxDistance=conf["max_distance"])
    trackers = []
    trackableObjects = {}

    # keep the count of total number of frames
    totalFrames = 0

    # start the frames per second throughput estimator
    fps = FPS().start()

    # loop over the frames of the stream
    while True:
        # load the line configuration file
        lines_offset_conf = Conf(inputArguments["lines"])
        # instantiate license Numbers inputs Dictionary
        licenseNumberInputs = []
        # grab the next frame from the stream
        currentFrame = get_frame_from_video_stream(videoStream=videoStream)

        # check if the frame is None, if so, break out of the loop
        if currentFrame is None:
            break

        # resize the frame
        currentFrame = imutils.resize(currentFrame, width=conf["frame_width"])
        rgb = cv2.cvtColor(currentFrame, cv2.COLOR_BGR2RGB)

        # if the frame dimensions are empty, set them
        if W is None or H is None:
            (H, W) = currentFrame.shape[:2]

        # initialize our list of bounding box rectangles returned by
        # either (1) our object detector or (2) the correlation trackers
        boundingBoxes = []

        # check to see if we should run a more computationally expensive
        # object detection method to aid our tracker
        if totalFrames % conf["track_object"] == 0:
            detections = obtain_detections_in_frame(
                frame=currentFrame, network=network)
            trackers = build_trackers_list_from_detections(
                detections, rgb, H, W)

        # otherwise, we should utilize our object *trackers* rather than
        # object *detectors* to obtain a higher frame processing
        # throughput
        else:
            boundingBoxes = build_bounding_box_list_from_trackers_list(
                trackers, rgb)

        # save clean original frame before drawing on it
        cleanFrame = currentFrame.copy()
        # draw 2 vertical lines and one horizontal line in the frame -- once an
        # object crosses these lines we will start the timers
        (LeftToRightLine, RightToLeftLine, HorizontalLine) = calculate_zone_boundaries(
            H, W, lines_offset_conf)
        draw_lines(LeftToRightLine, RightToLeftLine,
                   HorizontalLine, currentFrame, H, W)

        # use the centroid tracker to associate the (1) old object
        # centroids with (2) the newly computed object centroids
        objects = centroidTracker.update(boundingBoxes)
        # loop over the tracked objects
        for (objectID, centroid) in objects.items():
            trackingBoundingBox = centroidTracker.objectsToBoundingBoxes[centroid.tostring(
            )]
            # check to see if a trackable object exists for the current
            # object ID
            currentTrackableObject = trackableObjects.get(objectID, None)
            # if there is no existing trackable object, create one
            if currentTrackableObject is None:
                currentTrackableObject = create_trackable_object(RightToLeftLine, LeftToRightLine, HorizontalLine,
                                                                 centroid,
                                                                 objectID)
            # otherwise, there is a trackable object
            else:
                append_license_input_info_to_inputs_list(currentTrackableObject, licenseNumberInputs, objectID,
                                                         cleanFrame,
                                                         trackingBoundingBox)
                check_and_handle_objects_location_in_frame(currentTrackableObject, RightToLeftLine, LeftToRightLine,
                                                           HorizontalLine, objectID, centroid, cleanFrame, currentFrame,
                                                           alarmThread)

            # store the trackable object in our dictionary
            trackableObjects[objectID] = currentTrackableObject
            draw_information_on_object(
                currentFrame, centroid, objectID, currentTrackableObject, trackingBoundingBox)

        if not display_frame(currentFrame):
            break

        # increment the total number of frames processed thus far and
        # then update the FPS counter
        totalFrames += 1
        fps.update()

        stop_alarm_for_dissappeared_object(
            inputAlarmThread=alarmThread, inputObjectsList=centroidTracker.objects)

        # handle plate recognition from data collected earlier and assign it to an object
        handle_license_plates_in_frame(
            licenseNumberInputs, trackableObjects, totalFrames)

    end_program(fps, videoStream, alarmThread)


def main():
    run_program()


if __name__ == "__main__":
    inputArguments = get_input_arguments()

    # load the configuration file
    conf = Conf(inputArguments["conf"])
    lines_offset_conf = Conf(inputArguments["lines"])

    # initialize the list of class labels MobileNet SSD was trained to
    # detect
    CLASSES = ["background", "aeroplane", "bicycle", "bird", "boat",
               "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
               "dog", "horse", "motorbike", "person", "pottedplant", "sheep",
               "sofa", "train", "tvmonitor"]
    main()
