!pip install roboflow

from roboflow import Roboflow
rf = Roboflow(api_key="ZzD21wz5oTPdE0fhb04C")
project = rf.workspace("tomatoes-iicln").project("nbl")
version = project.version(6)
dataset = version.download("yolov5")
                