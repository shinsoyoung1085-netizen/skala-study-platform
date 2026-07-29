import { Badge } from "@/components/common/Badge";
import type { Post } from "@/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <div className="card flex flex-col gap-3">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{post.content}</p>

      <div className="flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <Badge key={tag} tone="primary">
            #{tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{post.author.name}</span>
        <span>{new Date(post.created_at).toLocaleString("ko-KR")}</span>
      </div>
    </div>
  );
}
