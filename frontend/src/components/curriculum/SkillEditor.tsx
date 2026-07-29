import { useState } from "react";

import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { SKILL_LEVEL_OPTIONS } from "@/constants/skillLevels";
import type { UserSkill, UserSkillItem } from "@/types";

interface SkillEditorProps {
  skills: UserSkill[];
  onSave: (items: UserSkillItem[]) => Promise<void>;
}

/** 마이페이지의 역량 프로필(분야별 이해도) 조회/편집 섹션. 저장 시 전체를 교체한다. */
export function SkillEditor({ skills, onSave }: SkillEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rows, setRows] = useState<UserSkillItem[]>(
    skills.map((s) => ({ category: s.category, level: s.level })),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setRows(skills.map((s) => ({ category: s.category, level: s.level })));
    setError(null);
    setIsEditing(true);
  };

  const updateRow = (index: number, patch: Partial<UserSkillItem>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { category: "", level: "MEDIUM" }]);
  };

  const handleSave = async () => {
    setError(null);
    const cleaned = rows.filter((r) => r.category.trim().length > 0);
    setIsSaving(true);
    try {
      await onSave(cleaned);
      setIsEditing(false);
    } catch (err) {
      setError(extractErrorMessage(err, "역량 프로필 저장에 실패했습니다."));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">역량 프로필 (분야별 이해도)</h3>
          <Button variant="outline" size="sm" onClick={startEditing}>
            편집
          </Button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 역량 프로필이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Badge key={s.category} tone="primary">
                {s.category} · {s.level_label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold text-gray-900">역량 프로필 편집</h3>
      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="분야 (예: 운영체제)"
              value={row.category}
              onChange={(e) => updateRow(index, { category: e.target.value })}
              className="flex-1"
            />
            <Select
              options={SKILL_LEVEL_OPTIONS}
              value={row.level}
              onChange={(e) => updateRow(index, { level: e.target.value })}
              className="w-24"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="shrink-0 rounded-full px-2 py-1 text-sm text-gray-400 hover:text-red-500"
              aria-label="삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addRow}>
        + 분야 추가
      </Button>

      <div className="flex gap-2">
        <Button onClick={handleSave} isLoading={isSaving}>
          저장
        </Button>
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
