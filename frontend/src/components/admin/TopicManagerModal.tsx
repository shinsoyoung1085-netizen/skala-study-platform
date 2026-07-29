import { useCallback, useEffect, useState, type FormEvent } from "react";

import { createTopicByAdmin, deleteTopicByAdmin } from "@/api/admin";
import { extractErrorMessage } from "@/api/client";
import { fetchTopics } from "@/api/curricula";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import type { Curriculum, Topic } from "@/types";

interface TopicManagerModalProps {
  curriculum: Curriculum;
  onClose: () => void;
  onChanged: () => void;
}

/** 특정 교육과정의 단원 목록 조회/추가/삭제를 담당하는 관리자 모달. */
export function TopicManagerModal({ curriculum, onClose, onChanged }: TopicManagerModalProps) {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(String((topics?.length ?? 0) + 1));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchTopics(curriculum.id);
      setTopics(res.items);
      setOrder(String(res.items.length + 1));
    } catch (err) {
      setError(extractErrorMessage(err, "단원 목록을 불러오지 못했습니다."));
    }
  }, [curriculum.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const orderNumber = Number(order);
    if (!title.trim() || !Number.isInteger(orderNumber) || orderNumber < 1) {
      setError("단원명과 순서(1 이상 정수)를 올바르게 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTopicByAdmin(curriculum.id, { title: title.trim(), order: orderNumber });
      setTitle("");
      await load();
      onChanged();
    } catch (err) {
      setError(extractErrorMessage(err, "단원 생성에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (topicId: number) => {
    if (!window.confirm("이 단원을 삭제하시겠습니까? 단원의 Q&A 메시지도 함께 삭제됩니다.")) return;
    try {
      await deleteTopicByAdmin(topicId);
      await load();
      onChanged();
    } catch (err) {
      setError(extractErrorMessage(err, "단원 삭제에 실패했습니다."));
    }
  };

  return (
    <Modal title={`${curriculum.title} - 단원 관리`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}

        {topics && topics.length === 0 && (
          <p className="text-sm text-gray-400">등록된 단원이 없습니다.</p>
        )}

        {topics && topics.length > 0 && (
          <div className="flex flex-col gap-2">
            {topics.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-800">
                  {t.order}주차 · {t.title}
                </span>
                <Button variant="danger" size="sm" onClick={() => handleDelete(t.id)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAdd} className="flex items-end gap-2 border-t border-gray-100 pt-4">
          <Input
            label="단원명"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Input
            label="순서"
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-20"
          />
          <Button type="submit" isLoading={isSubmitting}>
            추가
          </Button>
        </form>
      </div>
    </Modal>
  );
}
