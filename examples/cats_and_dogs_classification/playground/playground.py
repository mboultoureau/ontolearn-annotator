import json
import time
from io import BytesIO
import os
import numpy as np
import requests
import tensorflow as tf
from PIL import Image

PLATFORM_URL = os.environ["PLATFORM_URL"]
PROJECT_ID = os.environ["PROJECT_ID"]

model = tf.keras.models.load_model("/app/model.keras")

while True:
    try:
        response = requests.get(
            f"{PLATFORM_URL}/api/v1/projects/{PROJECT_ID}/playground-tasks?status=PENDING"
        )
        data = response.json()

        # In data, input is a json object with a key 'file' containing the URL of the file to predict
        for task in data:
            task_id = task["id"]

            # Change status to PROCESSING
            requests.patch(
                f"{PLATFORM_URL}/api/v1/projects/{PROJECT_ID}/playground-tasks/{task_id}",
                data=json.dumps({"status": "PROCESSING"}),
            )

            filepath = task["input"]["file"]
            file = f"{PLATFORM_URL}/{filepath}"

            # Download the file
            download = requests.get(file)

            # Resize the image (160, 160)
            IMG_SIZE = (160, 160)
            image = Image.open(BytesIO(download.content))

            # Resize the image
            resized_image = image.resize(IMG_SIZE)

            # Predict
            image = np.array(resized_image)
            image = np.expand_dims(image, axis=0)
            prediction = model.predict(image)

            formatted_prediction = [
                {
                    "name": "dog",
                    "value": str(prediction[0][0])
                },
                {
                    "name": "cat",
                    "value": str(1 - prediction[0][0])
                }
            ]

            body = {
                "output": {"prediction": formatted_prediction},
                "status": "COMPLETED",
            }

            requests.patch(
                f"{PLATFORM_URL}/api/v1/projects/{PROJECT_ID}/playground-tasks/{task_id}",
                data=json.dumps(body),
            )
    except Exception as e:
        print(e)

    time.sleep(10)