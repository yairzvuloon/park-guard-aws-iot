# USAGE
# python3 streamer.py --conf config/config.json --lines config/lines_offset_config.json --stream True

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
from report_handler import handle_report

# import the necessary packages
from pyimagesearch.centroidtracker import CentroidTracker
from pyimagesearch.trackableobject import TrackableObject
from pyimagesearch.utils import Conf


def draw_lines(leftToRightLine, rightToLeftLine, horizontalLine, frame, frameHeight, frameWidth):
    cv2.line(frame, (leftToRightLine, 0),
             (leftToRightLine, frameHeight), (0, 255, 255), 2)
    cv2.line(frame, (rightToLeftLine, 0),
             (rightToLeftLine, frameHeight), (0, 255, 255), 2)
    cv2.line(frame, (0, horizontalLine),
             (frameWidth, horizontalLine), (0, 255, 255), 2)


def get_frame_from_video_stream(videoStream):
    if conf["read_from_video"]:
        ret, frame = videoStream.read()
    else:
        frame = videoStream.read()

    return frame


def calculate_zone_boundaries(H, W, lines_offset_conf):
    LeftToRightLine = W // conf["left_to_right_line"] + \
                      lines_offset_conf["left_vertical_offset"]
    RightToLeftLine = W - \
                      W // conf["left_to_right_line"] + \
                      lines_offset_conf["right_vertical_offset"]
    HorizontalLine = H // conf["horizontal_line"] + \
                     lines_offset_conf["horizontal_offset"]

    return LeftToRightLine, RightToLeftLine, HorizontalLine


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


def end_program(fps, videoStream):
    # stop the timer and display FPS information
    fps.stop()
    print_fps_info(fps)

    # close any open windows
    cv2.destroyAllWindows()
    # clean up
    clean_up_threads(videoStream)


def print_fps_info(fps):
    print("[INFO] elapsed time: {:.2f}".format(fps.elapsed()))
    print("[INFO] approx. FPS: {:.2f}".format(fps.fps()))


def clean_up_threads(videoStream):
    # clean up
    print("[INFO] cleaning up...")
    time.sleep(2.0)
    if conf["read_from_video"]:
        videoStream.release()
    else:
        videoStream.stop()
    time.sleep(2.0)
    print("[INFO] Goodbye dear")


def get_input_arguments():
    # construct the argument parser and parse the arguments
    argumentParser = argparse.ArgumentParser()
    argumentParser.add_argument("-c", "--conf", required=True,
                                help="Path to the input configuration file")
    argumentParser.add_argument("-l", "--lines", required=True,
                                help="Path to the input lines offset configuration file")
    argumentParser.add_argument("-s", "--stream", type=str2bool, nargs='?',
                                const=True, default=False,
                                help="Activate streaming")
    args = vars(argumentParser.parse_args())
    return args


def str2bool(v):
    if isinstance(v, bool):
        return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')


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

    # initialize the frame dimensions (we'll set them as soon as we read
    # the first frame from the video)
    H = None
    W = None

    # keep the count of total number of frames
    totalFrames = 0

    # start the frames per second throughput estimator
    fps = FPS().start()

    # loop over the frames of the stream
    while True:
        # load the line configuration file
        lines_offset_conf = Conf(inputArguments["lines"])

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

        # save clean original frame before drawing on it
        cleanFrame = currentFrame.copy()

        # draw 2 vertical lines and one horizontal line in the frame
        (LeftToRightLine, RightToLeftLine, HorizontalLine) = calculate_zone_boundaries(
            H, W, lines_offset_conf)
        draw_lines(LeftToRightLine, RightToLeftLine,
                   HorizontalLine, currentFrame, H, W)

        if not display_frame(currentFrame):
            break

        # increment the total number of frames processed thus far and
        # then update the FPS counter
        totalFrames += 1
        fps.update()

        if not isStreaming:
            handle_report(None, frame=currentFrame, isForStreaming=True, isStreaming=isStreaming)
            break
        else:
            if totalFrames % conf["streaming_frequency"]:
                handle_report(None, frame=currentFrame, isForStreaming=True, isStreaming=isStreaming)

    end_program(fps, videoStream)


def main():
    run_program()


if __name__ == "__main__":
    inputArguments = get_input_arguments()

    # load the configuration file
    conf = Conf(inputArguments["conf"])
    lines_offset_conf = Conf(inputArguments["lines"])
    isStreaming = inputArguments["stream"]

    print("[INFO] now streaming: " + str(isStreaming))

    main()
