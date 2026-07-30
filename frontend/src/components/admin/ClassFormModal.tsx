import { useState, type FormEvent } from "react";

import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import { CAMPUS_OPTIONS } from "@/constants/campusOptions";
import type { ClassCreatePayload } from "@/types";

interface ClassFormModalProps {
  onClose: () => void;
  onSubmit: (payload: ClassCreatePayload) => Promise<void>;
}

/** 반 생성 모달 (관리자 전용). */
export function ClassFormModal({ onClose, onSubmit }: ClassFormModalProps) {
  const [campus, setCampus] = useState(CAMPUS_OPTIONS[0].code);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ campus, name });
    } catch (err) {
      setError(extractErrorMessage(err, "저장에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="새 반 생성" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        <Select
          label="캠퍼스"
          options={CAMPUS_OPTIONS}
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          required
        />
        <Input label="반 이름" placeholder="예: 1반" value={name} onChange={(e) => setName(e.target.value)} required />

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          생성
        </Button>
      </form>
    </Modal>
  );
}
