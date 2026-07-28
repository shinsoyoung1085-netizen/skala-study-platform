// 업데이트 공지 팝업을 "오늘 하루 보지 않기" 체크 시 localStorage에 기록해두는 유틸.
const STORAGE_KEY = "skala_study_dismissed_update";

interface DismissedRecord {
  updateId: number;
  /** 이 시각(ISO) 이전까지는 같은 공지를 다시 보여주지 않는다. */
  hideUntil: string;
}

function readRecord(): DismissedRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DismissedRecord;
  } catch {
    return null;
  }
}

/** 이 공지를 지금 보여줘도 되는지 여부. 새 공지(id가 다름)이거나 dismiss 기한이 지났으면 true. */
export function shouldShowUpdateNotice(updateId: number): boolean {
  const record = readRecord();
  if (!record) return true;
  if (record.updateId !== updateId) return true;
  return new Date() >= new Date(record.hideUntil);
}

/** "오늘 하루 보지 않기" 체크 후 닫을 때 호출 — 자정까지 같은 공지를 숨긴다. */
export function dismissUpdateNoticeForToday(updateId: number): void {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const record: DismissedRecord = { updateId, hideUntil: endOfToday.toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
