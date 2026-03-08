import requests
import sys

url = "http://127.0.0.1:5000/whatsapp"
messages = ["Hi", "Swargate", "Kothrud", "45"]

with open("convo_out.txt", "w", encoding="utf-8") as f:
    for msg in messages:
        f.write(f"--- Sending: {msg} ---\n")
        data = {"From": "whatsapp:+910000000000", "Body": msg}
        response = requests.post(url, data=data)
        f.write(f"Status: {response.status_code}\n")
        f.write(response.text + "\n\n")
