"""
Post ORM 객체를 응답 스키마로 변환하는 공용 함수.
"""
from app.models.post import Post
from app.schemas.post import PostResponse
from app.schemas.user import UserSummary


def to_post_response(post: Post) -> PostResponse:
    return PostResponse(
        id=post.id,
        curriculum_id=post.curriculum_id,
        author=UserSummary.model_validate(post.user),
        content=post.content,
        tags=[t.tag for t in post.tags],
        created_at=post.created_at,
    )
