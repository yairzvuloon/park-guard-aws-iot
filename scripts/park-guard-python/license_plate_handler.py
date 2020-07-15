import os
from pprint import pprint
import cv2
import requests

imageName = "car"
imgType = ".jpg"


def handle_plate_identifier(croppedFrame, accessToken, objectID, score=0, regions=[]):
    currentImageName = imageName + str(objectID) + imgType
    cv2.imwrite(currentImageName, croppedFrame)
    licenseNumber = str()

    with open(currentImageName, 'rb') as fp:
        response = requests.post(
            'https://api.platerecognizer.com/v1/plate-reader/',
            data=dict(regions=regions),  # Optional
            files=dict(upload=fp),
            headers={'Authorization': 'Token {}'.format(accessToken)})

    responseJson = response.json()

    if "results" in responseJson:
        if responseJson["results"]:
            licenseNumber = responseJson["results"][0]['plate'] if responseJson["results"][0]['score'] >= score else str()

    os.remove(currentImageName)

    return licenseNumber
