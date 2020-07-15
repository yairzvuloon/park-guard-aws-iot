# import the necessary packages
from report_handler import handle_report
from datetime import datetime


class TrackableObject:
    def __init__(self, objectID, centroid, licenseNumber=str()):
        # store the object ID, then initialize a list of centroids
        # using the current centroid
        self.objectID = objectID
        self.centroids = [centroid]
        self.licenseNumber = licenseNumber
        self.alarmThread = None
        # initialize the start time of tracking in seconds
        self.startTime = None
        # initialize elapsed time from tracking
        self.elapsedTime = None
        # initialize marker color
        self.markerColor = (0, 255, 0)  # green
        # initialize boolean used to indicate if time passed
        self.isBlocking = False
        # initialize boolean used to indicate if the the object passed the line
        self.passedTheLine = False
        # initialize boolean used to indicate the trackable object being created in illegal zone
        self.createdInIllegalZone = False

        # initialize start and end dates of blocking event
        self.startEventDate = None
        self.endEventDate = None

        self.blockFrame = None

    def handle_enter_illegal_zone(self, startTime):
        self.passedTheLine = True
        self.startTime = startTime
        self.markerColor = (0, 255, 255)
        print("[INFO] ID {} entered illegal zone".format(self.objectID))

    def handle_time_passed(self, alarmThread, frame, isAlarmFeatureOn, isReportFeatureOn):
        print("[INFO] ID {} passed permitted time in illegal zone".format(self.objectID))
        self.isBlocking = True
        self.markerColor = (255, 0, 0)
        self.startEventDate = datetime.today().strftime('%Y-%m-%d-%H-%M-%S')
        self.endEventDate = None
        self.blockFrame = frame
        if isReportFeatureOn:
            handle_report(self, frame)
        if isAlarmFeatureOn:
            self.alarmThread = alarmThread
            self.alarmThread.start(self.objectID)

    def handle_returning_to_legal_zone(self, isAlarmFeatureOn, isReportFeatureOn):
        print("[INFO] ID {} back to legal zone".format(self.objectID))
        self.passedTheLine = False
        self.elapsedTime = 0
        self.markerColor = (0, 255, 0)
        if self.isBlocking:
            self.isBlocking = False
            self.endEventDate = datetime.today().strftime('%Y-%m-%d-%H-%M-%S')
            print("[INFO] ID {} End Alarm".format(self.objectID))
            if isReportFeatureOn:
                handle_report(self, self.blockFrame)
            if isAlarmFeatureOn and self.alarmThread:
                self.alarmThread.stop()
