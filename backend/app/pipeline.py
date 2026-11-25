import asyncio
import json
import logging
from typing import Optional, Callable, Dict, Any

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.aggregators.llm_response import (
    LLMFullResponseAggregator,
)
from pipecat.services.elevenlabs.stt import ElevenLabsSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams,
)
from pipecat.serializers.protobuf import ProtobufFrameSerializer

from .config import settings
from .tools import TOOLS_SCHEMA, SYSTEM_PROMPT, execute_tool

logger = logging.getLogger("nexovai.pipecat")

class PipecatVoicePipeline:
    """
    Real-time Pipecat Voice Pipeline:
    Caller Audio -> Silero VAD -> ElevenLabs STT -> Nvidia NIM LLM (with Function Calling) -> ElevenLabs TTS -> Caller Audio
    """
    def __init__(
        self,
        websocket,
        on_transcript: Optional[Callable[[str, str], None]] = None,
        on_action: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        self.websocket = websocket
        self.on_transcript = on_transcript
        self.on_action = on_action
        self.task: Optional[PipelineTask] = None
        self.runner: Optional[PipelineRunner] = None

    async def build_pipeline(self):
        # 1. Transport
        transport_params = FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=True,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True
        )
        transport = FastAPIWebsocketTransport(
            websocket=self.websocket,
            params=transport_params
        )

        # 2. STT (ElevenLabs)
        # If user provides an ELEVENLABS_API_KEY it uses ElevenLabs STT; otherwise defaults gracefully
        eleven_api_key = settings.ELEVENLABS_API_KEY or "dummy-key"
        stt = ElevenLabsSTTService(
            api_key=eleven_api_key,
        )

        # 3. LLM (Nvidia NIM OpenAI-Compatible Service)
        llm = OpenAILLMService(
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
            model=settings.PRIMARY_MODEL
        )

        # Register tools/functions
        async def handle_check_availability(function_name, tool_call_id, args, llm, context, result_callback):
            logger.info(f"Pipecat tool call: {function_name} with {args}")
            res = execute_tool("check_doctor_availability", args)
            if self.on_action:
                self.on_action({"tool": "check_doctor_availability", "arguments": args, "result": res})
            await result_callback(res)

        async def handle_book_appointment(function_name, tool_call_id, args, llm, context, result_callback):
            logger.info(f"Pipecat tool call: {function_name} with {args}")
            res = execute_tool("book_appointment", args)
            if self.on_action:
                self.on_action({"tool": "book_appointment", "arguments": args, "result": res})
            await result_callback(res)

        async def handle_cancel_appointment(function_name, tool_call_id, args, llm, context, result_callback):
            logger.info(f"Pipecat tool call: {function_name} with {args}")
            res = execute_tool("cancel_appointment", args)
            if self.on_action:
                self.on_action({"tool": "cancel_appointment", "arguments": args, "result": res})
            await result_callback(res)

        llm.register_function("check_doctor_availability", handle_check_availability)
        llm.register_function("book_appointment", handle_book_appointment)
        llm.register_function("cancel_appointment", handle_cancel_appointment)

        # 4. TTS (ElevenLabs)
        tts = ElevenLabsTTSService(
            api_key=eleven_api_key,
            voice_id=settings.ELEVENLABS_VOICE_ID,
            model=settings.ELEVENLABS_MODEL_ID
        )

        # 5. Assemble Pipeline
        pipeline = Pipeline([
            transport.input(),
            stt,
            llm,
            tts,
            transport.output()
        ])

        self.task = PipelineTask(pipeline)
        self.runner = PipelineRunner()
        return self.task, self.runner

    async def run(self):
        task, runner = await self.build_pipeline()
        await runner.run(task)

    async def cancel(self):
        if self.task:
            await self.task.cancel()
