import { useState } from "react";

import { Modal } from "@/components/common/Modal";
import { RECOMMENDATION_TAG_OPTIONS } from "@/constants/recommendationTags";

interface RecommendLeaderModalProps {
  onClose: () => void;
  onSelect: (tagCode: string) => Promise<void>;
}

/** 모임장 추천 사유 태그를 고르는 모달. 태그를 누르는 즉시 추천이 전송된다 (1-클릭). */
export function RecommendLeaderModal({ onClose, onSelect }: RecommendLeaderModalProps) {
  const [submittingTag, setSubmittingTag] = useState<string | null>(null);

  const handlePick = async (tagCode: string) => {
    setSubmittingTag(tagCode);
    try {
      await onSelect(tagCode);
    } finally {
      setSubmittingTag(null);
    }
  };

  return (
    <Modal title="모임장님을 칭찬해주세요" onClose={onClose}>
      <p className="mb-4 text-sm text-gray-500">
        선택하시면 익명으로 모임장님께 칭찬 메시지와 포인트가 전달됩니다.
      </p>
      <div className="flex flex-col gap-2">
        {RECOMMENDATION_TAG_OPTIONS.map((tag) => (
          <button
            key={tag.code}
            type="button"
            disabled={submittingTag !== null}
            onClick={() => handlePick(tag.code)}
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary disabled:opacity-50"
          >
            <span>{tag.label}</span>
            {submittingTag === tag.code && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/40 border-t-primary" />
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
