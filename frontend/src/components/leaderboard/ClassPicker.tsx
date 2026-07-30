import { useEffect, useState } from "react";

import { fetchMyCampusClasses } from "@/api/leaderboard";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";

interface ClassPickerProps {
  currentClassId?: number | null;
  onAssign: (classId: number) => Promise<void>;
}

/** 내 캠퍼스 안에서 소속 반을 선택/변경하는 컴포넌트. 마이페이지에서 사용된다. */
export function ClassPicker({ currentClassId, onAssign }: ClassPickerProps) {
  const [options, setOptions] = useState<{ code: string; label: string }[] | null>(null);
  const [selected, setSelected] = useState<string>(currentClassId ? String(currentClassId) : "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMyCampusClasses()
      .then((classes) => setOptions(classes.map((c) => ({ code: String(c.id), label: c.name }))))
      .catch((err) => setError(extractErrorMessage(err, "반 목록을 불러오지 못했습니다.")));
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setError(null);
    setIsSaving(true);
    try {
      await onAssign(Number(selected));
    } catch (err) {
      setError(extractErrorMessage(err, "반 설정에 실패했습니다."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      {options && options.length === 0 && (
        <p className="text-sm text-gray-400">아직 개설된 반이 없어요. 관리자에게 문의해주세요.</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Select
            options={options ?? []}
            placeholder="반을 선택하세요"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!options || options.length === 0}
          />
        </div>
        <Button onClick={handleAssign} isLoading={isSaving} disabled={!selected}>
          설정
        </Button>
      </div>
    </div>
  );
}
