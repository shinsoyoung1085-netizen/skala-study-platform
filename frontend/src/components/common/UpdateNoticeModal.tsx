import { useState } from "react";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import type { UpdateNotice } from "@/types";

interface UpdateNoticeModalProps {
  update: UpdateNotice;
  onClose: (dismissForToday: boolean) => void;
}

/** 홈 진입 시 새 업데이트 공지를 알려주는 팝업. */
export function UpdateNoticeModal({ update, onClose }: UpdateNoticeModalProps) {
  const [dismissForToday, setDismissForToday] = useState(false);

  return (
    <Modal title="새로운 업데이트가 있습니다! 🎉" onClose={() => onClose(dismissForToday)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{update.category_label}</Badge>
          {update.version && <Badge tone="neutral">{update.version}</Badge>}
        </div>

        <h3 className="text-lg font-bold text-gray-900">{update.title}</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{update.content}</p>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={dismissForToday}
            onChange={(e) => setDismissForToday(e.target.checked)}
          />
          오늘 하루 동안 보지 않기
        </label>

        <Button fullWidth onClick={() => onClose(dismissForToday)}>
          확인했어요
        </Button>
      </div>
    </Modal>
  );
}
