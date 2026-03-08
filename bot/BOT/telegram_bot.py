import json
import logging
import requests
import os
import sys
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)
from telegram.error import BadRequest
from openai import OpenAI

# Add parent directory to path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.utils.logger import setup_logger
from app.utils.file_handler import load_data

logger = setup_logger("TelegramTrafficBot")

client = OpenAI(
    base_url=settings.OPENROUTER_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY,
)

def load_rag_context():
    input_data = load_data("input.json")
    output_data = load_data("output.json")
    
    context_str = "INPUT TRAFFIC STATE DATA:\n"
    context_str += json.dumps(input_data, indent=2) + "\n\n"
    context_str += "AI TRAFFIC DECISION DATA:\n"
    context_str += json.dumps(output_data, indent=2) + "\n\n"
    
    return context_str

def query_ai(prompt, context):
    system_prompt = f"""
You are a Professional Smart City Traffic Intelligence Assistant for Pune.
Provide formal, concise, and data-driven responses.
Use the provided dataset to answer queries.

CRITICAL RULE — MISSING DATA:
If the user asks about a specific place, venue, or event that is NOT in the provided context, you MUST respond with a special trigger tag.
Format: [NEED_ANALYSIS: Actual Name of Venue]
Example: If the user asks about "Magarpatta City" and it's missing, you MUST return "[NEED_ANALYSIS: Magarpatta City]".
Do NOT add any other explanation or text.

CONTEXT:
{context}
"""
    try:
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            timeout=60
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"AI query failed: {str(e)}")
        return f"System Error: Unable to contact AI engine."

async def safe_edit(query, text, reply_markup=None):
    try:
        await query.edit_message_text(text=text, reply_markup=reply_markup)
    except BadRequest as e:
        if "Message is not modified" not in str(e):
            await query.message.reply_text(text, reply_markup=reply_markup)

def main_menu():
    keyboard = [
        [InlineKeyboardButton("Traffic Overview", callback_data="traffic")],
        [InlineKeyboardButton("AI Decision Intelligence", callback_data="ai")],
        [InlineKeyboardButton("System Status", callback_data="status")],
        [InlineKeyboardButton("Ask AI (Custom Query)", callback_data="ask")]
    ]
    return InlineKeyboardMarkup(keyboard)

def traffic_menu():
    keyboard = [
        [InlineKeyboardButton("Current Traffic Severity", callback_data="severity")],
        [InlineKeyboardButton("Weather Condition", callback_data="weather")],
        [InlineKeyboardButton("Venue Monitoring Status", callback_data="venue")],
        [InlineKeyboardButton("Back to Main Menu", callback_data="main")]
    ]
    return InlineKeyboardMarkup(keyboard)

def ai_menu():
    keyboard = [
        [InlineKeyboardButton("Priority Level", callback_data="priority")],
        [InlineKeyboardButton("Actions Executed", callback_data="actions")],
        [InlineKeyboardButton("Back to Main Menu", callback_data="main")]
    ]
    return InlineKeyboardMarkup(keyboard)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "SMART TRAFFIC MANAGEMENT SYSTEM\n"
        "City: Pune\n"
        "Mode: AI Traffic Intelligence (RAG Enabled)\n\n"
        "Select a module from the control panel below."
    )
    await update.message.reply_text(text, reply_markup=main_menu())

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    inputs = load_data("input.json")
    outputs = load_data("output.json")
    
    input_data = inputs[-1] if inputs else {}
    output_data = outputs[-1] if outputs else {}

    if query.data == "main":
        await safe_edit(query, "Main Control Panel - Select Module:", reply_markup=main_menu())
    elif query.data == "traffic":
        await safe_edit(query, "Traffic Overview Module", reply_markup=traffic_menu())
    elif query.data == "ai":
        await safe_edit(query, "AI Decision Intelligence Module", reply_markup=ai_menu())
    elif query.data == "status":
        status_msg = "SYSTEM STATUS\nAI Engine: Connected\nData Pipeline: Active\nMonitoring Network: Operational\nCity Grid: Pune Smart Traffic System"
        await safe_edit(query, status_msg, reply_markup=main_menu())
    elif query.data == "severity":
        severity = input_data.get("traffic_prediction", {}).get("severity", "Not Available")
        await safe_edit(query, f"Current Traffic Severity: {severity}", reply_markup=traffic_menu())
    elif query.data == "weather":
        weather = input_data.get("weather", {}).get("condition", "Not Available")
        await safe_edit(query, f"Weather Condition: {weather}", reply_markup=traffic_menu())
    elif query.data == "venue":
        venue = input_data.get("venue", {}).get("name", "Not Available")
        await safe_edit(query, f"Monitored Venue: {venue}", reply_markup=traffic_menu())
    elif query.data == "priority":
        priority = output_data.get("priority_level", "Not Available")
        await safe_edit(query, f"AI Priority Level: {priority}", reply_markup=ai_menu())
    elif query.data == "actions":
        actions = output_data.get("traffic_management_actions", [])
        await safe_edit(query, f"Total AI Actions Executed: {len(actions)}", reply_markup=ai_menu())
    elif query.data == "ask":
        context.user_data["rag_mode"] = True
        await safe_edit(query, "AI Query Mode Activated.\nPlease enter your traffic-related question.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_text = update.message.text
    if context.user_data.get("rag_mode"):
        await update.message.chat.send_action(action="typing")
        rag_context = load_rag_context()
        ai_response = query_ai(user_text, rag_context)

        if "[NEED_ANALYSIS:" in ai_response:
            venue = ai_response.split("[NEED_ANALYSIS:")[1].split("]")[0].strip()
            try:
                backend_url = "http://localhost:8000/analyze"
                resp = requests.post(backend_url, json={"venue": venue}, timeout=45)
                if resp.status_code == 200:
                    ai_response = query_ai(user_text, load_rag_context())
            except Exception as e:
                ai_response = f"System Error: Unable to complete live analysis for '{venue}'."

        await update.message.reply_text(ai_response, reply_markup=main_menu())
        context.user_data["rag_mode"] = False
    else:
        await update.message.reply_text("Please use the control panel below.", reply_markup=main_menu())

def main():
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is missing!")
        return
    app = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(button_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
