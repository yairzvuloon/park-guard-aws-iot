import json
import os
from subprocess import check_output
import base64
import cv2
from pprint import pprint
import sys


def handle_report(trackableObject, frame):
    print("[INFO] creating report...")
    fileName = 'report.json'
    base64ImageString = encode_frame_to_base64(frame)
    jsonData = build_report_json_data(trackableObject, base64ImageString)
    post_report(jsonData)


def encode_frame_to_base64(frame):
    imageName = "block_frame.jpg"
    cv2.imwrite(imageName, frame)
    with open(imageName, "rb") as image_file:
        encode_string = base64.b64encode(image_file.read())
    os.remove(imageName)
    return encode_string.decode('utf-8')


def build_report_json_data(trackableObject, base64ImageString):
    jsonData = {
        "isBlocked": trackableObject.isBlocking,
        "license_number": trackableObject.licenseNumber if trackableObject.licenseNumber else "null",
        "picture": base64ImageString,
        "start_time": trackableObject.startEventDate,
        "end_time": trackableObject.endEventDate if trackableObject.endEventDate else "null",
        "isApproved": trackableObject.isApproved
    }

    return jsonData


def post_report(jsonData):
    json_string = json.dumps(jsonData)
    json_string = json_string.replace(" ", "")
    print(json_string)
    # out = check_output(["./sendReport.sh", "hi"])
    # print("[INFO] {}".format(out))
