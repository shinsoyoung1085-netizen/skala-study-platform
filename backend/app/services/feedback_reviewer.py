"""
후기/건의 게시글에 대한 AI 현실성 검토 + 답변 초안을 생성하는 서비스.
결과는 그대로 게시되지 않고, 관리자가 검토/수정 후 직접 게시해야 한다.
ANTHROPIC_API_KEY가 설정되지 않은 환경에서는 사용할 수 없다.
"""
from dataclasses import dataclass

from anthropic import Anthropic

from app.core.config import settings
from app.models.feedback import Feedback

_MODEL = "claude-haiku-4-5-20251001"

_SYSTEM_PROMPT = """당신은 SKALA STUDY(SKALA 교육생 전용 스터디 매칭 플랫폼) 운영진의 검토를 돕는 보조자입니다.
회원이 익명으로 남긴 후기/건의 게시글 하나를 검토해서 submit_feedback_review 도구로 결과를 제출하세요.

- feasibility_note: 이 건의가 실제로 반영 가능한지에 대한 간결하고 솔직한 현실성 검토 (2~3문장)
- draft_reply: 작성자에게 그대로 보여줄 수 있는 정중하고 구체적인 관리자 답변 초안 (2~4문장)
- suggested_resolved: 이 답변만으로 "해결됨" 처리해도 되는지 여부
  (버그 제보인데 실제로 고쳐지지 않았다면 false, 단순 칭찬이거나 답변만으로 충분한 건의라면 true)
"""

_TOOL = {
    "name": "submit_feedback_review",
    "description": "후기/건의 게시글에 대한 현실성 검토 결과를 제출합니다.",
    "input_schema": {
        "type": "object",
        "properties": {
            "feasibility_note": {"type": "string"},
            "draft_reply": {"type": "string"},
            "suggested_resolved": {"type": "boolean"},
        },
        "required": ["feasibility_note", "draft_reply", "suggested_resolved"],
    },
}


class FeedbackReviewerNotConfiguredError(Exception):
    """ANTHROPIC_API_KEY가 설정되지 않아 AI 초안 생성 기능을 사용할 수 없을 때 발생한다."""


@dataclass
class FeedbackAiDraft:
    feasibility_note: str
    draft_reply: str
    suggested_resolved: bool


def generate_feedback_draft(feedback: Feedback, category_label: str) -> FeedbackAiDraft:
    if not settings.ANTHROPIC_API_KEY:
        raise FeedbackReviewerNotConfiguredError

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=_MODEL,
        max_tokens=500,
        system=_SYSTEM_PROMPT,
        tools=[_TOOL],
        tool_choice={"type": "tool", "name": "submit_feedback_review"},
        messages=[
            {
                "role": "user",
                "content": f"분류: {category_label}\n내용: {feedback.content}",
            }
        ],
    )

    tool_use = next(block for block in message.content if block.type == "tool_use")
    return FeedbackAiDraft(
        feasibility_note=tool_use.input["feasibility_note"],
        draft_reply=tool_use.input["draft_reply"],
        suggested_resolved=bool(tool_use.input["suggested_resolved"]),
    )
