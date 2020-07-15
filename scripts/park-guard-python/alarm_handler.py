import pygame
import glob
from threading import Thread


def get_alarm_sound():
    alarmArray = glob.glob('alarm/*')
    return alarmArray[0]


class AlarmHandler:
    def __init__(self, src=0):
        self.stopped = False
        self.src = src  # get_alarm_sound() if src == 0 else src
        self.objectID = None

    def start(self, objectID=None):
        self.objectID = objectID
        self.stopped = False
        Thread(target=self.sound_alarm, args=()).start()
        return self

    def sound_alarm(self):
        pygame.mixer.init()
        pygame.mixer.music.load(self.src)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            if self.stopped:
                pygame.mixer.music.stop()
                return

    def stop(self):
        self.stopped = True
        self.objectID = None
