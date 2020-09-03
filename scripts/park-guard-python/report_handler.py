import json
import os
from subprocess import check_output
import base64
import cv2
from pprint import pprint
from datetime import datetime
import sys


def handle_report(trackableObject, frame, isForStreaming=False, isStreaming=False):
    print("[INFO] creating report...")
    fileName = 'report.json'
    base64ImageString = encode_frame_to_base64(frame)

    if not isForStreaming:
        jsonData = build_block_event_json_data(
            trackableObject, base64ImageString)
    else:
        jsonData = build_streaming_json_data(isStreaming, base64ImageString)

    post_report(jsonData)


def encode_frame_to_base64(frame):
    imageName = "block_frame.jpg"
    cv2.imwrite(imageName, frame)
    with open(imageName, "rb") as image_file:
        encode_string = base64.b64encode(image_file.read())
    os.remove(imageName)
    return encode_string.decode('utf-8')


def build_block_event_json_data(trackableObject, base64ImageString):
    jsonData = {
        "isBlocked": trackableObject.isBlocking,
        "license_number": trackableObject.licenseNumber if trackableObject.licenseNumber else "null",
        "picture": base64ImageString,
        "start_time": trackableObject.startEventDate,
        "end_time": trackableObject.endEventDate if trackableObject.endEventDate else "null",
        "isApproved": trackableObject.isApproved
    }

    return jsonData


def build_streaming_json_data(isStreaming, base64ImageString):
    jsonData = {
        "isStreaming": isStreaming,
        "picture": base64ImageString,
        "start_time": datetime.today().strftime('%Y-%m-%d-%H-%M-%S'),
    }

    return jsonData


def post_report(jsonData):
    json_string = json.dumps(jsonData)
    json_string = json_string.replace(" ", "")
    print(json_string)
