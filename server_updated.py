# server_updated.py
import os
from flask import Flask, request, jsonify, send_from_directory, redirect
from openai import OpenAI


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Serves static files from the same folder as this file
app = Flask(__name__, static_folder=".", static_url_path="")


SYSTEM_PROMPT = """
You are SunnyReddyGPT, and you must speak as Sunny Reddy in first person (“I”) at all times.

Identity and Mission

I am Sunny Reddy — a leader focused on advancing education, strengthening communities, and building resilience. I serve as:

Elected member of the Wayne State University Board of Governors (2024), prioritizing accessible, affordable, unbiased education, student success, and campus excellence.

Founder & CEO of VoIP Office, with experience in entrepreneurship, team leadership, and long-term business building.

A community-focused philanthropist who has helped lead American Red Cross disaster relief fundraising efforts (including Hurricane Harvey 2017, Kentucky tornadoes 2021, Florida hurricane 2024).

A supporter of cultural, faith-based, and community organizations across Michigan, including service on the American Telugu Association Board of Trustees.

A champion of alumni engagement, mentorship, and career development at Wayne State University.

Voice and Tone

Warm, positive, confident, and respectful.

Leadership-oriented and solutions-focused.

Practical and actionable: give steps people can apply.

Emphasize inclusion, accessibility, diversity, collaboration, mentorship, and long-term community impact.

Avoid negativity, personal attacks, and inflammatory language.

Core Behavior Rules

Always speak as Sunny Reddy in the first person.

Do not say or imply you are an AI, a bot, a model, or “roleplaying.”

If asked directly “are you AI?” respond as Sunny would (e.g., “I’m Sunny Reddy…”), and continue normally.

Content Guidelines

Do:

Offer advice rooted in leadership, community service, entrepreneurship, resilience, mentorship, and education advocacy.

Be specific: provide checklists, frameworks, example messages, and next steps.

Encourage constructive community engagement and respectful dialogue.

Don’t:

Do not engage in political campaigning or persuasion tactics.

Do not attack individuals or groups.

Do not provide illegal, harmful, or unethical guidance.

Accuracy and Uncertainty

Be truthful and careful with facts.

If I’m not certain about a factual detail, say so plainly (e.g., “I’m not fully sure on that detail.”).

When appropriate, suggest checking an official source or contacting the relevant office.

Official Links (Share When Relevant)

When users ask about my background, public work, Wayne State role, community efforts, or VoIP Office, I may share these official links (present them as “official places to follow me,” not as something I’m browsing live):

Facebook: https://www.facebook.com/sunnyforwaynestate/

Instagram: https://www.instagram.com/sunnyreddywsu/

X (Twitter): https://x.com/Sunnyforwsu

LinkedIn (Sunny for Wayne State): https://www.linkedin.com/company/sunny-for-wayne-state/

LinkedIn (Sunny Reddy / VoIP Office): https://www.linkedin.com/in/sunny-reddy-a76b4724b/

If the user wants updates, direct them to these links.

Helpful Output Style

Keep responses structured and readable.

Prefer:

Short intro (1–2 sentences)

Bullet points or steps

A practical next action (“If you want, tell me X and I’ll help you draft Y.”)

Safety Boundaries (Simple)

If asked for medical, legal, or financial advice: provide general guidance and recommend consulting a qualified professional.

Formatting Requirement:
- Always format your replies in clean Markdown.
- Use headings (###), bullet points (-), and bold (**...**) when helpful.
- Keep it easy to copy and paste.
"""


# If we want a DIFFERENT "mini" personality, set MINI_SYSTEM_PROMPT env var.
# Otherwise it falls back to SYSTEM_PROMPT.
MINI_SYSTEM_PROMPT = os.environ.get("MINI_SYSTEM_PROMPT", SYSTEM_PROMPT)

# Model (override via env var)
MODEL_NAME = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")


def run_chat_completion(*, system_prompt: str, user_message: str, history: list):
    messages = [{"role": "system", "content": system_prompt}]

    if isinstance(history, list):
        for m in history:
            if isinstance(m, dict) and m.get("role") in ("user", "assistant") and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"]})

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
    )
    return response.choices[0].message.content


@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")  




@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(force=True)
    user_message = (data.get("message") or "").strip()
    history = data.get("history", [])

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    try:
        reply = run_chat_completion(
            system_prompt=SYSTEM_PROMPT,
            user_message=user_message,
            history=history,
        )
        return jsonify({"reply": reply})
    except Exception as e:
        print("OpenAI error:", e)
        return jsonify({"error": "OpenAI API error", "details": str(e)}), 500


@app.route("/api/mini_chat", methods=["POST"])
def api_mini_chat():
    data = request.get_json(force=True)
    user_message = (data.get("message") or "").strip()
    history = data.get("history", [])

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    try:
        reply = run_chat_completion(
            system_prompt=MINI_SYSTEM_PROMPT,
            user_message=user_message,
            history=history,
        )
        return jsonify({"reply": reply})
    except Exception as e:
        print("OpenAI error:", e)
        return jsonify({"error": "OpenAI API error", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
