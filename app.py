import os
from flask import Flask, request, jsonify, send_from_directory
from base64 import b64decode
from openai import OpenAI
from dotenv import load_dotenv
import json
import base64
import re
import requests
from datetime import datetime

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

app = Flask(__name__)

# Configure the upload directory
UPLOAD_FOLDER = "images/"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# Function to encode the image
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def extract_content_inside_braces(input_str):
    # This regex matches content inside the first pair of curly braces, including nested braces
    match = re.search(r"\{([^{}]*({[^{}]*})*[^{}]*)\}", input_str)
    if match:
        return match.group(1)  # Return the content inside the braces
    else:
        return "No content found inside braces"


def parseCompletion(text):

    prompt = (
        """Parse the text below and return the directions from the string and the explanation as JSON. 
Instructions like "s4" should be converted to s,s,s,s.

Directions must be in this format: [w,w,w,s,s,]
        
Rewrite the explanation as if you are the robot making the decisions.
    
    {
        "explanation: ...,
        "directions": [...] 
        
    }
    
    ###
    """
        + text
        + "\n\nJSON"
    )

    # print("*" * 100)
    # print(prompt)
    # print("*" * 100)

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response.choices[0].message.content


def getCompletion(user_prompt_data):

    user_text = ""
    previous_directions = ""

    for item in user_prompt_data:
        if item["text"]:
            user_text += item["text"] + "\n\n###\n\n"
        if "previous_directions" in item:
            previous_directions = item["previous_directions"]

    instruction = user_text  # + "\n\n" + previous_directions

    print("Instruction:", instruction)

    content = [
        {"type": "text", "text": instruction},
    ]

    image_counter = 0
    for item in user_prompt_data:

        if item["image"]:

            base64_image = encode_image(item["image"])

            img = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}",
                    "detail": "auto",
                },
            }
            content.append(img)
            
            os.remove(item["image"])

            image_counter += 1

    # print("*" * 100)
    # print("Total images:", image_counter)
    # print("Previous directions:", previous_directions)
    # print("*" * 100)

    # os.remove(item["image"])

    api_key = os.environ.get("OPENAI_API_KEY")

    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
    
    instructions = """
You are GPT-4 with Vision and can read images. 
    
Return instructions for finding object using n,s,w,e.
    
(Example n, n, w = north 2 squares then west 1). 
    
Acceptable direction format is n,w,e,s"
    """

    payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": instructions,
                    }
                ],
            },
            {
                "role": "user",
                "content": content,
            },
        ],
        "max_tokens": 2000,
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
    )

    json_data = response.json()

    # print(json_data)

    input_str = json_data["choices"][0]["message"]["content"]
    
    print("*" * 100)
    print(input_str)
    print("*" * 100)

    return parseCompletion(input_str)


@app.route("/")
def serve_grid():
    return send_from_directory("static", "index.html")


@app.route("/robot", methods=["POST"])
def handle_robot():
    data = request.get_json()
    capturedData = data  # Array of captured data (images and text)

    print("Inbound")

    user_prompt_data = []

    # Process each captured data item
    for item in capturedData:
        image_data = item["image"]
        prompt_data = item["text"]
        # previous_directions = item["previous_directions"] 

        # Decode the base64-encoded image data
        image_data = image_data.split(",")[1]
        decoded_data = b64decode(image_data)

        # Generate a unique filename for the image
        filename = f"robot_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

        # Save the image to the specified directory
        with open(filepath, "wb") as file:
            file.write(decoded_data)

        user_prompt_data.append(
            {
                "text": prompt_data,
                "image": filepath,
               # "previous_directions": previous_directions,
            }
        )

    print(user_prompt_data)

    response = getCompletion(user_prompt_data)

    print(response)

    json_data = json.loads(response)
    directions = [direction.lower() for direction in json_data["directions"]]
    explanation = json_data["explanation"]
    print(directions)

    return jsonify({"directions": directions, "explanation": explanation})


if __name__ == "__main__":
    app.run(debug=True, port=5005)
