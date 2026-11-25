import json
import logging
import urllib.request
from typing import List, Dict, Any, Tuple, Optional
from .config import settings
from .tools import TOOLS_SCHEMA, SYSTEM_PROMPT, execute_tool, detect_text_language

logger = logging.getLogger("nexovai.llm")

class NvidiaLLMClient:
    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key or settings.NVIDIA_API_KEY
        self.base_url = (base_url or settings.NVIDIA_BASE_URL).rstrip("/")
        self.primary_model = settings.PRIMARY_MODEL
        self.fallback_model = settings.FALLBACK_MODEL
        self.backup_model = settings.BACKUP_MODEL
        self.last_detected_language = "English"

    def _call_api(self, payload: Dict[str, Any], timeout: int = 12) -> Dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def chat_step(
        self,
        messages: List[Dict[str, Any]],
        tools_enabled: bool = True
    ) -> Tuple[str, List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Executes one conversation step.
        Returns:
            - text_response (str): The voice response to speak to the user
            - updated_messages (list): The new conversation history
            - action_event (dict or None): Any tool action executed (for dashboard events)
        """
        # Find latest user utterance to detect language
        last_user_content = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_content = m.get("content", "")
                break

        detected_lang = detect_text_language(last_user_content)
        self.last_detected_language = detected_lang

        # Construct language-pinned system prompt
        current_system_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"=== CURRENT CALLER LANGUAGE: {detected_lang} ===\n"
            f"MANDATORY REQUIREMENT: You MUST speak 100% in {detected_lang}. "
            f"Do NOT switch languages. Do NOT mix English words into {detected_lang} or vice versa. "
            f"Speak with genuine human empathy and natural receptionist courtesy."
        )

        active_messages = [{"role": "system", "content": current_system_prompt}] + [
            m for m in messages if m.get("role") != "system"
        ]

        # Models to try in order of speed and reliability
        candidate_models = [self.primary_model, self.fallback_model, self.backup_model]
        last_error = None
        action_taken = None

        for model in candidate_models:
            payload: Dict[str, Any] = {
                "model": model,
                "messages": active_messages,
                "max_tokens": 300,
                "temperature": 0.5
            }
            if tools_enabled:
                payload["tools"] = TOOLS_SCHEMA
                payload["tool_choice"] = "auto"

            try:
                data = self._call_api(payload, timeout=8)
                choice = data["choices"][0]
                message = choice["message"]
                tool_calls = message.get("tool_calls")

                # If model called tools, execute them
                if tool_calls and len(tool_calls) > 0:
                    tool_call = tool_calls[0]
                    tool_id = tool_call.get("id", "call_1")
                    fn_name = tool_call["function"]["name"]
                    raw_args = tool_call["function"]["arguments"]

                    try:
                        args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    except Exception:
                        args = {}

                    logger.info(f"Executing tool {fn_name} with args {args}")
                    tool_result = execute_tool(fn_name, args)
                    action_taken = {
                        "tool": fn_name,
                        "arguments": args,
                        "result": tool_result,
                        "detected_language": detected_lang
                    }

                    # Append assistant message with tool_call and tool response
                    new_messages = list(active_messages) + [
                        {
                            "role": "assistant",
                            "content": message.get("content") or "",
                            "tool_calls": [tool_call]
                        },
                        {
                            "role": "tool",
                            "tool_call_id": tool_id,
                            "name": fn_name,
                            "content": json.dumps(tool_result)
                        },
                        {
                            "role": "system",
                            "content": f"Summarize the tool result conversationally for the caller in 1-2 natural sentences. REMINDER: The caller is speaking {detected_lang}, so reply 100% in {detected_lang}."
                        }
                    ]

                    # Now generate natural speech response summarizing the tool result
                    followup_payload = {
                        "model": model,
                        "messages": new_messages,
                        "max_tokens": 200,
                        "temperature": 0.35
                    }
                    followup_data = self._call_api(followup_payload, timeout=8)
                    followup_choice = followup_data["choices"][0]
                    final_reply = followup_choice["message"].get("content") or ""

                    # Clean up final reply of any reasoning markers
                    if "</think>" in final_reply:
                        final_reply = final_reply.split("</think>")[-1].strip()
                    final_reply = final_reply.strip()
                    new_messages.append({"role": "assistant", "content": final_reply})
                    return final_reply, new_messages, action_taken

                else:
                    # Direct natural voice message
                    content = message.get("content") or message.get("reasoning_content") or ""
                    if "</think>" in content:
                        content = content.split("</think>")[-1].strip()
                    
                    new_messages = list(active_messages) + [{"role": "assistant", "content": content.strip()}]
                    return content.strip(), new_messages, None

            except Exception as e:
                logger.warning(f"Model {model} failed with error: {e}. Trying next fallback...")
                last_error = e
                continue

        # If all API calls timed out or failed, provide language-appropriate fallback
        if detected_lang == "Telugu":
            fallback_speech = "నమస్కారం! నేను నెక్సోవ్‌ఏఐ క్లినిక్ నుంచి మాట్లాడుతున్నాను. డాక్టర్ అపాయింట్‌మెంట్ వివరాల కోసం నేను మీకు ఎలా సహాయపడగలను?"
        elif detected_lang == "Hindi":
            fallback_speech = "नमस्ते! मैं नेक्सोवएआई क्लिनिक से बोल रही हूँ। मैं डॉक्टर की उपलब्धता और अपॉइंटमेंट में आपकी क्या मदद कर सकती हूँ?"
        elif detected_lang == "Tamil":
            fallback_speech = "வணக்கம்! நெக்ஸோவ்ஏஐ கிளினிக்கிற்கு வரவேற்கிறோம். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
        else:
            fallback_speech = (
                "Hello, thank you for calling NexovAI Medical Clinic. "
                "I can check specialist availability, book a consultation, or manage existing appointments. "
                "Which doctor or specialty would you like to inquire about?"
            )

        new_messages = list(active_messages) + [{"role": "assistant", "content": fallback_speech}]
        return fallback_speech, new_messages, None
