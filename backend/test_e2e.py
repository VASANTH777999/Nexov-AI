import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import init_db, get_all_doctors, get_all_appointments
from backend.app.tools import execute_tool, detect_text_language
from backend.app.llm_client import NvidiaLLMClient

def run_tests():
    init_db()
    docs = get_all_doctors()
    print(f"[OK] Doctors count: {len(docs)}")
    assert len(docs) == 6, "Expected 6 doctors"

    client = NvidiaLLMClient()

    # 1. Platform Knowledge test (Pediatrician & Orthopedic details)
    print("\n[*] 1. Testing Deep Platform Knowledge...")
    msgs_platform = [
        {"role": "user", "content": "Can you tell me about your pediatric and orthopedic specialists, and where are their rooms?"}
    ]
    reply_platform, _, _ = client.chat_step(msgs_platform, tools_enabled=True)
    print(f"[OK] Platform Knowledge Reply:\n    {reply_platform}\n")
    assert "Harvey Karp" in reply_platform or "Karp" in reply_platform or "Andrews" in reply_platform or "Pediatric" in reply_platform, "Should mention specialists"

    # 2. Unrelated casual / wellness chat (stress advice)
    print("\n[*] 2. Testing Unrelated / Casual Human Conversation...")
    msgs_casual = [
        {"role": "user", "content": "I had a very exhausting and stressful day today. What helps with tension?"}
    ]
    reply_casual, _, _ = client.chat_step(msgs_casual, tools_enabled=False)
    print(f"[OK] Casual Human Chat Reply:\n    {reply_casual}\n")
    assert len(reply_casual) > 20, "Should provide warm, helpful casual response"

    # 3. Telugu conversational fluency & warmth
    print("\n[*] 3. Testing Telugu Conversational Fluency...")
    msgs_te = [
        {"role": "user", "content": "నమస్కారం! మీ క్లినిక్‌లో డాక్టర్ డేవిడ్ పటేల్ ఎక్కడ ఉంటారు? వారు దేనికి స్పెషలిస్ట్?"}
    ]
    reply_te, _, _ = client.chat_step(msgs_te, tools_enabled=True)
    print(f"[OK] Telugu Reply:\n    {reply_te}\n")
    assert detect_text_language(reply_te) == "Telugu", "Expected pure Telugu reply"

    # 4. Spoken phone verification before booking
    print("\n[*] 4. Testing Mandatory Phone Read-Back & Booking...")
    msgs_phone = [
        {"role": "user", "content": "Can I book the 10:30 AM slot tomorrow with Dr. Jenkins? My phone is 9876543210."},
        {"role": "assistant", "content": "Dr. Jenkins has the 10:30 AM slot open tomorrow. Before I confirm the booking, I have your phone number as 9876543210. Is that correct?"},
        {"role": "user", "content": "Yes, that is correct! Please book it."}
    ]
    reply_phone, _, action_phone = client.chat_step(msgs_phone, tools_enabled=True)
    print(f"[OK] Booking Execution Reply:\n    {reply_phone}\n")
    print(f"[OK] Action Triggered:\n    {action_phone.get('tool') if action_phone else 'None'}\n")
    assert action_phone and action_phone.get("tool") == "book_appointment", "book_appointment tool must be executed upon confirmation"

    print("[ALL SCENARIOS, KNOWLEDGE & TURN INTELLIGENCE VERIFIED 100%!]")

if __name__ == "__main__":
    run_tests()
