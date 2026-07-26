import { useState, type FormEvent } from "react";

import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { extractErrorMessage } from "@/api/client";
import { DayToggle } from "@/components/study/DayToggle";
import type { OptionItem, StudyCreatePayload } from "@/types";

interface StudyFormProps {
  categoryOptions: OptionItem[];
  dayOptions: OptionItem[];
  locationOptions: OptionItem[];
  onSubmit: (payload: StudyCreatePayload) => Promise<void>;
}

/** 스터디 생성 폼. 작성자는 로그인한 회원으로 서버에서 자동 저장되므로 입력받지 않는다. */
export function StudyForm({ categoryOptions, dayOptions, locationOptions, onSubmit }: StudyFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [examDate, setExamDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (code: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category || !location) {
      setError("카테고리와 장소를 선택해주세요.");
      return;
    }
    if (selectedDays.size === 0) {
      setError("요일을 하나 이상 선택해주세요.");
      return;
    }
    const capacityNumber = Number(capacity);
    if (!Number.isInteger(capacityNumber) || capacityNumber < 2) {
      setError("모집인원은 2명 이상의 숫자로 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        category,
        capacity: capacityNumber,
        description,
        days: Array.from(selectedDays),
        time,
        location,
        is_online: isOnline,
        exam_date: examDate || null,
      });
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 생성에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}

      <Input label="스터디명" value={name} onChange={(e) => setName(e.target.value)} required />

      <Select
        label="카테고리"
        options={categoryOptions}
        placeholder="카테고리를 선택하세요"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />

      <Input
        label="모집인원"
        type="number"
        min={2}
        max={100}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">스터디 설명</label>
        <textarea
          className="min-h-[96px] w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="스터디를 소개해주세요"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          요일 <span className="font-normal text-gray-400">(복수 선택 가능 — 월수금, 주말, 매일 등 자유롭게)</span>
        </label>
        <DayToggle options={dayOptions} selected={selectedDays} onToggle={toggleDay} />
      </div>

      <Input
        label="시간"
        placeholder="예: 19:00"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        required
      />

      <Select
        label="장소"
        options={locationOptions}
        placeholder="장소를 선택하세요"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={isOnline}
          onChange={(e) => setIsOnline(e.target.checked)}
        />
        온라인으로 진행되는 스터디입니다
      </label>

      <Input
        label="시험일자"
        type="date"
        value={examDate}
        onChange={(e) => setExamDate(e.target.value)}
        hint="자격증/어학 시험을 목표로 하는 스터디라면 선택해주세요 (선택 사항)"
      />

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        스터디 생성하기
      </Button>
    </form>
  );
}
