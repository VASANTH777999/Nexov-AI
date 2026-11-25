import { TOOLS_SCHEMA, SYSTEM_PROMPT, detectTextLanguage, executeServerTool } from './_lib/serverTools';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  let messages = body.messages || [];
  const userMessage = body.message;

  if (userMessage) {
    messages.push({ role: 'user', content: userMessage });
  }

  // Find latest user message to detect language
  let lastUserContent = '';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserContent = messages[i].content || '';
      break;
    }
  }

  const detectedLang = detectTextLanguage(lastUserContent);

  const currentSystemPrompt = `${SYSTEM_PROMPT}

=== CURRENT CALLER LANGUAGE: ${detectedLang} ===
MANDATORY REQUIREMENT: You MUST speak 100% in ${detectedLang}.
Do NOT switch languages. Do NOT mix English words into ${detectedLang} or vice versa.
Speak with genuine human empathy and natural receptionist courtesy.`;

  const activeMessages = [
    { role: 'system', content: currentSystemPrompt },
    ...messages.filter((m: any) => m.role !== 'system'),
  ];

  const apiKey =
    process.env.NVIDIA_API_KEY ||
    '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';
  const baseUrl = (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
  const candidateModels = [
    process.env.PRIMARY_MODEL || 'nvidia/nemotron-3.5-bolt-e4b',
    process.env.FALLBACK_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
    process.env.BACKUP_MODEL || 'mistralai/mistral-large-4-1t-a52b',
  ];

  let reply = '';
  let actionTaken: any = null;

  for (const model of candidateModels) {
    try {
      const payload: any = {
        model,
        messages: activeMessages,
        max_tokens: 300,
        temperature: 0.5,
        tools: TOOLS_SCHEMA,
        tool_choice: 'auto',
      };

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;
      const toolCalls = message?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        const fnName = toolCall.function?.name;
        let args = {};
        try {
          args = typeof toolCall.function?.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments || {};
        } catch (e) {
          args = {};
        }

        const toolResult = executeServerTool(fnName, args);
        actionTaken = {
          tool: fnName,
          arguments: args,
          result: toolResult,
          detected_language: detectedLang,
        };

        const followupMessages = [
          ...activeMessages,
          {
            role: 'assistant',
            content: message.content || '',
            tool_calls: [toolCall],
          },
          {
            role: 'tool',
            tool_call_id: toolCall.id || 'call_1',
            name: fnName,
            content: JSON.stringify(toolResult),
          },
          {
            role: 'system',
            content: `Summarize the tool result conversationally for the caller in 1-2 natural sentences. REMINDER: The caller is speaking ${detectedLang}, so reply 100% in ${detectedLang}.`,
          },
        ];

        const followupRes = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: followupMessages,
            max_tokens: 200,
            temperature: 0.35,
          }),
        });

        if (followupRes.ok) {
          const followupData = await followupRes.json();
          reply = followupData.choices?.[0]?.message?.content || '';
        }
      } else {
        reply = message?.content || '';
      }

      if (reply) {
        if (reply.includes('</think>')) {
          reply = reply.split('</think>').pop()!.trim();
        }
        break;
      }
    } catch (err) {
      console.warn(`Model ${model} attempt error:`, err);
    }
  }

  if (!reply) {
    if (detectedLang === 'Telugu') {
      reply = 'నమస్కారం! నేను నెక్సోవై మెడికల్ రిసెప్షనిస్ట్ అలెక్స్ మాట్లాడుతున్నాను. మీకు ఏ విధంగా సహాయపడగలను?';
    } else if (detectedLang === 'Hindi') {
      reply = 'नमस्ते! मैं नेक्सोवाई क्लिनिक से एलेक्स बात कर रही हूँ। मैं आपकी क्या मदद कर सकती हूँ?';
    } else {
      reply = "Hello! Thank you for calling NexovAI Medical Clinic. I'm Alex, your receptionist. How can I assist you today?";
    }
  }

  return res.status(200).json({
    reply,
    messages: [...messages, { role: 'assistant', content: reply }],
    action: actionTaken,
    detected_language: detectedLang,
  });
}
