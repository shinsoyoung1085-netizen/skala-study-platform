import { useEffect, useState } from "react";

import { fetchCurricula } from "@/api/curricula";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import type { Curriculum } from "@/types";

interface CurriculumPickerProps {
  currentCurriculumId?: number | null;
  onAssign: (curriculumId: number) => Promise<void>;
}

/** 소속 교육과정을 선택/변경하는 공용 컴포넌트. MyPage와 커리큘럼 대시보드 빈 상태에서 함께 사용된다. */
export function CurriculumPicker({ currentCurriculumId, onAssign }: CurriculumPickerProps) {
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [selected, setSelected] = useState<string>(currentCurriculumId ? String(currentCurriculumId) : "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCurricula()
      .then((res) => setCurricula(res.items))
      .catch((err) => setError(extractErrorMessage(err, "교육과정 목록을 불러오지 못했습니다.")));
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setError(null);
    setIsSaving(true);
    try {
      await onAssign(Number(selected));
    } catch (err) {
      setError(extractErrorMessage(err, "교육과정 설정에 실패했습니다."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Select
            options={(curricula ?? []).map((c) => ({ code: String(c.id), label: c.title }))}
            placeholder="교육과정을 선택하세요"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!curricula}
          />
        </div>
        <Button onClick={handleAssign} isLoading={isSaving} disabled={!selected}>
          설정
        </Button>
      </div>
    </div>
  );
}
