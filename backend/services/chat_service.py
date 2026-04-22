from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
import os
import random
import re
from datetime import datetime
from typing import Any

from Rag.rag_chain import limit_sentences
from services.llm_service import get_llm_service
from services.message_service import MessageService
from services.plan_service import PlanService
from services.result_service import ResultService
from services.session_service import SessionService


class ChatService:
    # Sets up the service with the helpers it needs.
    def __init__(self) -> None:
        # setup services
        self.message_service = MessageService()
        self.plan_service = PlanService()
        self.result_service = ResultService()
        self.session_service = SessionService()

    # Gets the chat timeout setting.
    @staticmethod
    def _llm_timeout_seconds() -> float:
        try:
            return float(os.getenv("CHAT_LLM_TIMEOUT_SECONDS", "8"))
        except ValueError:
            return 8.0

    # Generates an assistant reply with a timeout.
    @classmethod
    def _generate_reply_with_timeout(
        cls,
        question: str,
        history: list[dict[str, str]],
    ) -> dict[str, Any]:
        timeout_seconds = cls._llm_timeout_seconds()

        # Keep the UI responsive if a future hosted model is enabled.
        executor = ThreadPoolExecutor(max_workers=1)
        future = executor.submit(
            get_llm_service().generate_reply,
            question=question,
            chat_history=history,
        )
        try:
            return future.result(timeout=timeout_seconds)
        except TimeoutError as exc:
            future.cancel()
            executor.shutdown(wait=False, cancel_futures=True)
            raise TimeoutError(
                f"LLM response timed out after {timeout_seconds:g} seconds"
            ) from exc
        finally:
            if future.done():
                executor.shutdown(wait=False)

    # Builds a short results summary for the chat prompt.
    @staticmethod
    def _format_results_context(
        latest_result: dict[str, Any] | None,
        previous_results: list[dict[str, Any]],
    ) -> str:
        # build a short results summary for the prompt
        if not latest_result:
            return (
                "No previous assessment results are available. "
                "Focus on general supportive coaching and encourage the user to complete the assessment."
            )

        lines: list[str] = []

        latest_score = latest_result.get("addictionScore")
        latest_class = latest_result.get("predictedClass")
        latest_risk = latest_result.get("riskLevel")
        latest_triggers = latest_result.get("topTriggers", [])
        latest_recs = latest_result.get("recommendations", [])

        lines.append("Latest assessment summary:")
        if latest_score is not None:
            lines.append(f"- Latest addiction score: {latest_score}")
        if latest_class is not None:
            lines.append(f"- Latest dependence class: {latest_class}")
        if latest_risk:
            lines.append(f"- Latest risk level: {latest_risk}")
        if latest_triggers:
            lines.append(f"- Top triggers: {', '.join(latest_triggers)}")
        if latest_recs:
            lines.append(f"- Prior recommendations: {', '.join(latest_recs)}")

        if len(previous_results) > 1:
            lines.append("Previous assessment history:")
            for result in previous_results[1:4]:
                score = result.get("addictionScore")
                pred_class = result.get("predictedClass")
                risk = result.get("riskLevel")
                generated = result.get("generatedAt", "unknown date")
                lines.append(
                    f"- On {generated}: score={score}, class={pred_class}, risk={risk}"
                )

        lines.append(
            "Coach the user based on the strongest current signs of addiction, "
            "any visible improvement or worsening over time, and the retrieved recovery guidance."
        )

        return "\n".join(lines)

    # Builds recent chat history for the assistant.
    def _build_chat_history(
        self,
        session_id: str,
        limit: int = 12,
    ) -> list[dict[str, str]]:
        # collect recent chat history
        messages = self.message_service.get_session_messages(session_id)
        trimmed = messages[-limit:]

        history: list[dict[str, str]] = []
        for msg in trimmed:
            history.append(
                {
                    "role": msg["role"],
                    "content": msg["content"],
                }
            )

        return history

    # Finds the right user results for chat context.
    def _get_results_for_chat_context(
        self,
        session_id: str,
        user_id: str,
    ) -> tuple[list[dict[str, Any]], str]:
        # get results and fallback to session user if needed
        normalized_user_id = str(user_id).strip()
        previous_results = self.result_service.get_user_results(normalized_user_id, result_type="addiction")
        if previous_results:
            return previous_results, normalized_user_id

        session = self.session_service.get_session_detail(session_id)
        session_user_id = session.get("userId") if session else None

        if session_user_id and session_user_id != normalized_user_id:
            fallback_results = self.result_service.get_user_results(session_user_id, result_type="addiction")
            if fallback_results:
                return fallback_results, session_user_id

        return previous_results, normalized_user_id

    # Formats a date for display in chat.
    @staticmethod
    def _format_display_date(raw_date: str | None) -> str:
        if not raw_date:
            return "an earlier assessment"

        try:
            normalized = raw_date.replace("Z", "+00:00")
            return datetime.fromisoformat(normalized).strftime("%B %d, %Y")
        except ValueError:
            return raw_date

    # Describes whether a value improved, worsened, or stayed the same.
    @staticmethod
    def _classify_change(latest_value: int | None, previous_value: int | None) -> str:
        if latest_value is None or previous_value is None:
            return "unknown"
        if latest_value < previous_value:
            return "improved"
        if latest_value > previous_value:
            return "worsened"
        return "unchanged"

    # Builds a short progress summary from assessment history.
    @classmethod
    def _build_progress_summary(
        cls,
        latest_result: dict[str, Any] | None,
        previous_results: list[dict[str, Any]],
    ) -> str:
        if not latest_result:
            return (
                "Progress summary:\n"
                "- No prior assessment results are available.\n"
                "- Treat the current assessment as the user's baseline.\n"
                "- Do not describe improvement or decline unless historical data exists."
            )

        latest_score = latest_result.get("addictionScore")
        latest_class = latest_result.get("predictedClass")
        latest_risk = latest_result.get("riskLevel")
        latest_date = cls._format_display_date(latest_result.get("generatedAt"))

        if len(previous_results) <= 1:
            lines = [
                "Progress summary:",
                f"- Latest assessment date: {latest_date}",
            ]
            if latest_score is not None:
                lines.append(f"- Latest addiction score: {latest_score}")
            if latest_class is not None:
                lines.append(f"- Latest dependence class: {latest_class}")
            if latest_risk:
                lines.append(f"- Latest risk level: {latest_risk}")
            lines.append("- This is the baseline assessment; do not imply a trend yet.")
            return "\n".join(lines)

        previous_result = previous_results[1]
        previous_score = previous_result.get("addictionScore")
        previous_class = previous_result.get("predictedClass")
        previous_risk = previous_result.get("riskLevel")
        previous_date = cls._format_display_date(previous_result.get("generatedAt"))

        score_change = cls._classify_change(latest_score, previous_score)
        class_change = cls._classify_change(latest_class, previous_class)

        overall_trend = score_change
        if overall_trend == "unknown":
            overall_trend = class_change

        if overall_trend == "improved":
            interpretation = (
                "The latest assessment suggests measurable improvement compared with the previous assessment."
            )
        elif overall_trend == "worsened":
            interpretation = (
                "The latest assessment suggests higher current risk compared with the previous assessment."
            )
        elif overall_trend == "unchanged":
            interpretation = (
                "The latest assessment appears broadly stable compared with the previous assessment."
            )
        else:
            interpretation = (
                "Historical comparison is limited, so describe any trend cautiously."
            )

        lines = [
            "Progress summary:",
            f"- Latest assessment date: {latest_date}",
            f"- Previous assessment date: {previous_date}",
        ]
        if latest_score is not None and previous_score is not None:
            lines.append(
                f"- Addiction score changed from {previous_score} to {latest_score} ({score_change})."
            )
        if latest_class is not None and previous_class is not None:
            lines.append(
                f"- Dependence class changed from {previous_class} to {latest_class} ({class_change})."
            )
        if latest_risk and previous_risk:
            lines.append(
                f"- Risk level changed from {previous_risk} to {latest_risk}."
            )
        lines.append(f"- Interpretation: {interpretation}")

        return "\n".join(lines)

    # Finds the main focus areas from the latest result.
    @staticmethod
    def _extract_focus_areas(latest_result: dict[str, Any] | None) -> str:
        if not latest_result:
            return (
                "Focus areas:\n"
                "- No assessment-derived focus areas are available yet.\n"
                "- Give short, practical help based on the user's message."
            )

        triggers = latest_result.get("topTriggers", []) or []
        recommendations = latest_result.get("recommendations", []) or []
        lines = ["Focus areas:"]

        if triggers:
            lines.append(f"- Prioritize these likely problem areas: {', '.join(triggers[:3])}.")
        if recommendations:
            lines.append(
                f"- Build your advice around these practical directions: {', '.join(recommendations[:2])}."
            )

        lines.append(
            "- Keep the response tightly focused on one or two actionable steps for the highest-risk area."
        )
        return "\n".join(lines)

    # Gets the active plan for chat context.
    def _get_active_plan_for_chat_context(self, user_id: str) -> dict[str, Any] | None:
        try:
            return self.plan_service.get_active_plan(user_id)
        except Exception:
            return None

    # Formats the active plan for the chat prompt.
    @staticmethod
    def _format_plan_context(active_plan: dict[str, Any] | None) -> str:
        if not active_plan:
            return (
                "Active plan:\n"
                "- No active recovery plan is available.\n"
                "- Give practical support based on the assessment and the user's current message."
            )

        completed_actions = [
            action["title"]
            for action in active_plan.get("actions", [])
            if action.get("completed")
        ]
        pending_actions = [
            action["title"]
            for action in active_plan.get("actions", [])
            if not action.get("completed")
        ]

        lines = [
            "Active plan:",
            f"- Focus area: {active_plan.get('focusArea', 'general support')}",
            f"- Summary: {active_plan.get('summary', 'No summary available.')}",
        ]

        if pending_actions:
            lines.append(
                f"- Pending actions: {', '.join(pending_actions[:3])}."
            )
        if completed_actions:
            lines.append(
                f"- Completed actions: {', '.join(completed_actions[:3])}."
            )

        lines.append(
            "- When relevant, coach the user using this active plan before suggesting new strategies."
        )
        return "\n".join(lines)

    # Checks whether the message may be about a crisis.
    @staticmethod
    def _detect_crisis(text: str | None) -> bool:
        if not text:
            return False

        lowered = text.lower()
        crisis_terms = [
            "suicide",
            "kill myself",
            "self harm",
            "hurt myself",
            "end my life",
            "don't want to live",
        ]
        return any(term in lowered for term in crisis_terms)

    # Checks if the user is asking about their plan.
    @staticmethod
    def _is_plan_question(text: str | None) -> bool:
        if not text:
            return False
        lowered = text.lower()
        plan_terms = ["plan", "next action", "goal", "goals", "what should i do", "what else should i do"]
        return any(term in lowered for term in plan_terms)

    # Checks if the user is asking about assessment results or progress.
    @staticmethod
    def _is_results_question(text: str | None) -> bool:
        if not text:
            return False
        lowered = text.lower()
        result_terms = [
            "assessment",
            "result",
            "score",
            "risk",
            "improving",
            "improve",
            "worse",
            "worsening",
            "progress",
            "trend",
        ]
        return any(term in lowered for term in result_terms)

    # Formats active plan details as a chat answer.
    @staticmethod
    def _build_plan_answer(active_plan: dict[str, Any] | None) -> str | None:
        if not active_plan:
            return (
                "I do not see an active plan yet. Complete an assessment first, then I can explain your plan and help you work through the next action."
            )

        focus = str(active_plan.get("focusArea") or "your main focus").replace("_", " ")
        summary = active_plan.get("summary") or f"Your current plan focuses on {focus}."
        actions = active_plan.get("actions", []) or []
        pending_actions = [action for action in actions if not action.get("completed")]
        completed_actions = [action for action in actions if action.get("completed")]

        if pending_actions:
            next_action = pending_actions[0]
            response = (
                f"Your plan focuses on {focus}. {summary} "
                f"The next step is: {next_action.get('title')}. {next_action.get('description')}"
            )
        else:
            response = (
                f"Your plan focuses on {focus}. {summary} "
                "It looks like the listed actions are completed, so the next step is to keep practicing the strongest one or take another assessment to refresh the plan."
            )

        if completed_actions:
            response += f" You have already completed: {completed_actions[0].get('title')}."

        return limit_sentences(response)

    # Formats assessment results and progress as a chat answer.
    @classmethod
    def _build_results_answer(
        cls,
        latest_result: dict[str, Any] | None,
        previous_results: list[dict[str, Any]],
        progress_summary: str,
    ) -> str | None:
        if not latest_result:
            return (
                "I do not see assessment results yet. Once you complete an assessment, I can explain your score, risk level, triggers, and whether things are improving or getting worse."
            )

        score = latest_result.get("addictionScore")
        risk = latest_result.get("riskLevel")
        triggers = latest_result.get("topTriggers", []) or []

        lines: list[str] = []
        if score is not None and risk:
            lines.append(f"Your latest assessment shows an addiction score of {score} with a {risk} risk level.")
        elif score is not None:
            lines.append(f"Your latest assessment shows an addiction score of {score}.")
        elif risk:
            lines.append(f"Your latest assessment shows a {risk} risk level.")
        else:
            lines.append("Your latest assessment is saved, but it does not include a clear score or risk level.")

        if len(previous_results) > 1:
            previous_result = previous_results[1]
            score_change = cls._classify_change(
                latest_result.get("addictionScore"),
                previous_result.get("addictionScore"),
            )
            risk_change = "unknown"
            latest_risk_rank = ResultService._risk_rank(latest_result.get("riskLevel"))
            previous_risk_rank = ResultService._risk_rank(previous_result.get("riskLevel"))
            if latest_risk_rank is not None and previous_risk_rank is not None:
                risk_change = cls._classify_change(latest_risk_rank, previous_risk_rank)

            trend = risk_change if risk_change != "unknown" else score_change
            if trend == "improved":
                lines.append("Compared with your previous assessment, this looks improved.")
            elif trend == "worsened":
                lines.append("Compared with your previous assessment, this looks worse and may need extra attention.")
            elif trend == "unchanged":
                lines.append("Compared with your previous assessment, this looks about the same.")
            else:
                lines.append("I have prior results, but there is not enough comparable data to call the trend clearly.")
        else:
            lines.append("This is your baseline result, so I cannot say whether it is improving or getting worse until you complete another assessment.")

        if triggers:
            lines.append(f"Your top trigger areas are {', '.join(triggers[:3])}.")

        return limit_sentences(" ".join(lines))

    # Cleans up the assistant response before sending it.
    @staticmethod
    def _polish_assistant_response(response: str) -> str:
        if not response:
            return response

        # Remove model-style sections so chat reads like one natural message.
        text = response.strip()
        text = re.sub(
            r"(?ims)^\s*(?:#+\s*)?(?:3\s*[\).:-]\s*)?sources?\s+used\s*:?.*$",
            "",
            text,
        ).strip()
        text = re.sub(
            r"(?im)^\s*(?:#+\s*)?(?:1\s*[\).:-]\s*)?supportive response\s*:?\s*",
            "",
            text,
        )
        text = re.sub(
            r"(?im)^\s*(?:#+\s*)?(?:2\s*[\).:-]\s*)?practical next steps\s*:?\s*",
            "",
            text,
        )
        text = re.sub(
            r"(?im)^\s*(?:#+\s*)?retrieved guidance\s*:.*$",
            "",
            text,
        )

        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned_lines: list[str] = []
        for line in lines:
            line = re.sub(r"^\s*(?:[-*]|\d+\s*[\).])\s*", "", line).strip()
            if line:
                cleaned_lines.append(line)

        polished = " ".join(cleaned_lines)
        polished = re.sub(r"\s+", " ", polished).strip()
        return limit_sentences(polished or response.strip())

    # Builds a local fallback reply when the LLM is unavailable.
    @classmethod
    def _build_demo_fallback_response(
        cls,
        user_message: str | None,
        latest_result: dict[str, Any] | None,
        previous_results_count: int,
        progress_summary: str,
        active_plan: dict[str, Any] | None,
    ) -> str:
        if not user_message or not user_message.strip():
            opener = (
                "I'm here with you. We can take this one step at a time and focus on practical support."
            )
        else:
            opener = (
                f"I hear you. You said: \"{user_message.strip()}\". "
                "Thank you for sharing that."
            )

        risk_line = ""
        if latest_result:
            risk = latest_result.get("riskLevel")
            score = latest_result.get("addictionScore")
            parts: list[str] = []
            if risk is not None:
                parts.append(f"risk level: {risk}")
            if score is not None:
                parts.append(f"addiction score: {score}")
            if parts:
                risk_line = (
                    " Based on your latest assessment, "
                    + ", ".join(parts)
                    + "."
                )

        prompts = [
            "Try one small step today: delay the urge by 10 minutes and do something physical like water, walking, or moving rooms.",
            "If distractibility is high, put your phone out of reach during one task block and check it only after the block ends.",
            "If sleep is a problem, avoid social media for the last 30 minutes before bed and replace it with a quiet routine.",
            "Pick one trigger to watch today, such as boredom, stress, or being alone, and notice what happens right before you open the app.",
        ]
        prompt = random.choice(prompts)

        history_line = ""
        if previous_results_count > 1:
            history_line = " I can also help you compare what you're feeling now with your previous sessions."

        progress_line = ""
        if "measurable improvement" in progress_summary:
            progress_line = (
                " Your recent assessment history suggests improvement, and that progress is worth recognizing."
            )
        elif "higher current risk" in progress_summary:
            progress_line = (
                " Your recent assessment suggests things may be feeling heavier right now, and we can respond to that supportively."
            )
        elif "broadly stable" in progress_summary:
            progress_line = (
                " Your recent assessment looks fairly stable, which can help us focus on the next practical step."
            )

        plan_line = ""
        if active_plan:
            pending_action = next(
                (action["title"] for action in active_plan.get("actions", []) if not action.get("completed")),
                None,
            )
            if pending_action:
                plan_line = f" Your current plan suggests focusing on: {pending_action}."

        return f"{opener}{risk_line}{progress_line}{plan_line} {prompt}{history_line}".strip()

    # Generates the assistant response for a chat turn.
    def generate_initial_or_followup_response(
        self,
        session_id: str,
        user_id: str,
        user_message: str | None,
    ) -> dict[str, Any]:
        # get results with fallback logic
        previous_results, results_user_id = self._get_results_for_chat_context(
            session_id=session_id,
            user_id=user_id,
        )

        latest_result = previous_results[0] if previous_results else None

        # Combine assessment, progress, plan, and chat history into one RAG query.
        results_context = self._format_results_context(latest_result, previous_results)
        progress_summary = self._build_progress_summary(latest_result, previous_results)
        focus_areas = self._extract_focus_areas(latest_result)
        active_plan = self._get_active_plan_for_chat_context(results_user_id)
        plan_context = self._format_plan_context(active_plan)
        history = self._build_chat_history(session_id)

        if self._is_plan_question(user_message):
            plan_answer = self._build_plan_answer(active_plan)
            if plan_answer:
                return {
                    "assistantResponse": plan_answer,
                    "crisis": False,
                    "sources": ["active-plan"],
                    "latestResult": latest_result,
                    "previousResultsCount": len(previous_results),
                    "resultsUserId": results_user_id,
                    "activePlan": active_plan,
                    "fallbackUsed": False,
                }

        if self._is_results_question(user_message):
            results_answer = self._build_results_answer(
                latest_result,
                previous_results,
                progress_summary,
            )
            if results_answer:
                return {
                    "assistantResponse": results_answer,
                    "crisis": False,
                    "sources": ["assessment-results"],
                    "latestResult": latest_result,
                    "previousResultsCount": len(previous_results),
                    "resultsUserId": results_user_id,
                    "activePlan": active_plan,
                    "fallbackUsed": False,
                }

        # build the user question for rag
        if user_message and user_message.strip():
            question = (
                f"{user_message.strip()}\n\n"
                f"Assessment context:\n{results_context}\n\n"
                f"{progress_summary}\n\n"
                f"{focus_areas}\n\n"
                f"{plan_context}\n\n"
                "Response requirements:\n"
                "- Keep the response short: 2 to 4 sentences total.\n"
                "- Focus on helping the user with the most relevant assessment problem area.\n"
                "- If an active recovery plan exists, prefer supporting the next pending action in that plan.\n"
                "- Acknowledge completed plan actions briefly when useful, then build on that progress.\n"
                "- If distractibility, sleep issues, validation seeking, or similar signals appear important, address them directly.\n"
                "- Give 1 or 2 practical actions the user can do today.\n"
                "- Do not give a long explanation, list of sources, or academic-style summary.\n"
                "- Mention progress only briefly and only if it is directly useful.\n"
                "- Use a supportive, professional, plain-spoken tone."
            )
        else:
            question = (
                "Start the first supportive message after assessment.\n\n"
                f"Assessment context:\n{results_context}\n\n"
                f"{progress_summary}\n\n"
                f"{focus_areas}\n\n"
                f"{plan_context}\n\n"
                "Response requirements:\n"
                "- Keep the response short: 2 to 4 sentences total.\n"
                "- Briefly mention the main issue suggested by the assessment.\n"
                "- If an active recovery plan exists, align the response with the current focus area and pending actions.\n"
                "- Give 1 or 2 practical next steps the user can try today.\n"
                "- Do not produce long summaries, source lists, or essay-style coaching.\n"
                "- If this is the first assessment, frame it as a starting point.\n"
                "- Use a supportive, professional, plain-spoken tone."
            )

        try:
            # Run local RAG by default. Gemini can be enabled later with
            # CHAT_LLM_PROVIDER=gemini for richer hosted generation.
            rag_out = self._generate_reply_with_timeout(question, history)
            assistant_response = self._polish_assistant_response(rag_out["result"])

            return {
                "assistantResponse": assistant_response,
                "crisis": rag_out["crisis"],
                "sources": sorted(
                    {
                        d.metadata.get("source", "unknown")
                        for d in rag_out.get("source_documents", [])
                    }
                ),
                "latestResult": latest_result,
                "previousResultsCount": len(previous_results),
                "resultsUserId": results_user_id,
                "activePlan": active_plan,
                "fallbackUsed": False,
            }
        except Exception as exc:
            fallback_response = self._build_demo_fallback_response(
                user_message=user_message,
                latest_result=latest_result,
                previous_results_count=len(previous_results),
                progress_summary=progress_summary,
                active_plan=active_plan,
            )

            return {
                "assistantResponse": fallback_response,
                "crisis": self._detect_crisis(user_message),
                "sources": ["demo-fallback"],
                "latestResult": latest_result,
                "previousResultsCount": len(previous_results),
                "resultsUserId": results_user_id,
                "activePlan": active_plan,
                "fallbackUsed": True,
                "fallbackReason": str(exc),
            }

    # Saves the user message and assistant reply.
    def save_chat_turn(
        self,
        session_id: str,
        user_id: str,
        user_message: str | None,
        assistant_message: str,
    ) -> dict[str, Any]:
        # save user turn if there is one
        user_message_id = None

        if user_message and user_message.strip():
            user_result = self.message_service.add_message(
                session_id,
                {
                    "userId": user_id,
                    "role": "user",
                    "content": user_message.strip(),
                },
            )
            user_message_id = user_result["messageId"]

        # save assistant turn
        assistant_result = self.message_service.add_message(
            session_id,
            {
                "userId": user_id,
                "role": "assistant",
                "content": assistant_message,
            },
        )

        return {
            "userMessageId": user_message_id,
            "assistantMessageId": assistant_result["messageId"],
        }
