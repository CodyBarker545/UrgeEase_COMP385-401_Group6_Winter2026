from __future__ import annotations

from typing import Any

from services.llm_service import get_llm_service
from services.message_service import MessageService
from services.result_service import ResultService


class ChatService:
    def __init__(self) -> None:
        # setup services
        self.message_service = MessageService()
        self.result_service = ResultService()

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

    def generate_initial_or_followup_response(
        self,
        session_id: str,
        user_id: str,
        user_message: str | None,
    ) -> dict[str, Any]:
        # gather latest assessment context
        previous_results = self.result_service.get_user_results(user_id)
        latest_result = previous_results[0] if previous_results else None

        results_context = self._format_results_context(latest_result, previous_results)
        history = self._build_chat_history(session_id)

        # build the user question for rag
        if user_message and user_message.strip():
            question = (
                f"{user_message.strip()}\n\n" f"Assessment context:\n{results_context}"
            )
        else:
            question = (
                "Start the first supportive message after assessment.\n\n"
                f"Assessment context:\n{results_context}\n\n"
                "Tell the user their current result in a supportive way, mention prior result if available, "
                "point out the strongest current addiction-related signs, and suggest practical next steps."
            )

        # run rag + gemini
        rag_out = get_llm_service().generate_reply(
            question=question,
            chat_history=history,
        )

        return {
            "assistantResponse": rag_out["result"],
            "crisis": rag_out["crisis"],
            "sources": sorted(
                {
                    d.metadata.get("source", "unknown")
                    for d in rag_out.get("source_documents", [])
                }
            ),
            "latestResult": latest_result,
            "previousResultsCount": len(previous_results),
        }

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
