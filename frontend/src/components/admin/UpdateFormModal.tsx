import { useState, type FormEvent } from "react";

import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { extractErrorMessage } from "@/api/client";
import { UPDATE_CATEGORY_OPTIONS } from "@/constants/updateCategories";
import type { UpdateCreatePayload, UpdateNotice } from "@/types";

interface UpdateFormModalProps {
  initial?: UpdateNotice;
  onClose: () => void;
  onSubmit: (payload: UpdateCreatePayload) => Promise<void>;
}

/** 업데이트 공지 작성/수정 폼 모달. initial이 있으면 수정 모드로 동작한다. */
export function UpdateFormModal({ initial, onClose, onSubmit }: UpdateFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [version, setVersion] = useState(initial?.version ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        content,
        version: version || null,
        category,
        is_active: isActive,
      });
    } catch (err) {
      setError(extractErrorMessage(err, "저장에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={initial ? "업데이트 공지 수정" : "새 업데이트 공지 작성"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">내용</label>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="카테고리"
            options={UPDATE_CATEGORY_OPTIONS}
            placeholder="선택하세요"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <Input
            label="버전 (선택)"
            placeholder="예: v1.2.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          공지 활성화 (체크 해제 시 사용자에게 노출되지 않음)
        </label>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          저장
        </Button>
      </form>
    </Modal>
  );
}
