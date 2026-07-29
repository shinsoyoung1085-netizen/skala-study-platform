import { useState, type FormEvent } from "react";

import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import type { CurriculumCreatePayload } from "@/types";

interface CurriculumFormModalProps {
  onClose: () => void;
  onSubmit: (payload: CurriculumCreatePayload) => Promise<void>;
}

/** 교육과정 생성 모달. */
export function CurriculumFormModal({ onClose, onSubmit }: CurriculumFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ title, description });
    } catch (err) {
      setError(extractErrorMessage(err, "저장에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="새 교육과정 생성" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <Input label="교육과정명" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">설명 (선택)</label>
          <textarea
            className="min-h-[80px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          생성
        </Button>
      </form>
    </Modal>
  );
}
