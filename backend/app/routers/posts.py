"""
정보 공유 게시글(Post) 작성/조회/태그 필터 API. 소속 교육과정 안에서만 공유된다.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.post import Post, PostTag
from app.models.user import User
from app.schemas.post import PostCreateRequest, PostListResponse, PostResponse
from app.utils.post_mapper import to_post_response

router = APIRouter(prefix="/api/posts", tags=["정보공유"])


def _require_curriculum(current_user: User) -> int:
    if current_user.curriculum_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "교육과정을 먼저 설정해주세요.")
    return current_user.curriculum_id


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED, summary="정보 공유 게시글 작성")
def create_post(
    payload: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    curriculum_id = _require_curriculum(current_user)

    tags = list(dict.fromkeys(t.strip() for t in payload.tags if t.strip()))
    if not tags:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "태그를 1개 이상 입력해주세요.")

    post = Post(user_id=current_user.id, curriculum_id=curriculum_id, content=payload.content)
    db.add(post)
    db.flush()
    for tag in tags:
        db.add(PostTag(post_id=post.id, tag=tag))
    db.commit()
    db.refresh(post)

    return to_post_response(post)


@router.get("", response_model=PostListResponse, summary="정보 공유 피드 조회 (태그 필터, 다중 선택 시 OR 조건)")
def list_posts(
    tag: list[str] | None = Query(default=None, description="필터할 태그 (다중 선택 가능)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    curriculum_id = _require_curriculum(current_user)

    query = (
        select(Post)
        .options(selectinload(Post.user), selectinload(Post.tags))
        .where(Post.curriculum_id == curriculum_id)
    )
    if tag:
        query = query.where(Post.tags.any(PostTag.tag.in_(tag)))
    query = query.order_by(Post.created_at.desc())

    posts = db.scalars(query).unique().all()
    items = [to_post_response(p) for p in posts]
    return PostListResponse(total=len(items), items=items)


@router.get("/tags", response_model=list[str], summary="현재 소속 교육과정 내에서 사용된 태그 목록 (필터 칩용)")
def list_post_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    curriculum_id = _require_curriculum(current_user)

    rows = db.scalars(
        select(PostTag.tag)
        .join(Post, Post.id == PostTag.post_id)
        .where(Post.curriculum_id == curriculum_id)
        .distinct()
        .order_by(PostTag.tag)
    ).all()
    return list(rows)
