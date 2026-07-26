import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { fetchCategoryOptions, fetchDayOptions, fetchLocationOptions } from "@/api/options";
import { createStudy, fetchStudies, joinStudy } from "@/api/studies";
import { extractErrorMessage } from "@/api/client";
import { Alert } from "@/components/common/Alert";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Spinner } from "@/components/common/Spinner";
import { PageContainer } from "@/components/layout/PageContainer";
import { StudyCard } from "@/components/study/StudyCard";
import { StudyFilterBar } from "@/components/study/StudyFilterBar";
import { StudyForm } from "@/components/study/StudyForm";
import type { OptionItem, Study, StudyCreatePayload, StudyFilters } from "@/types";

/** 스터디 목록 페이지: 검색/필터, 카드 목록, 스터디 생성 모달을 포함한다. */
export function StudiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const [filters, setFilters] = useState<StudyFilters>({});
  const [categoryOptions, setCategoryOptions] = useState<OptionItem[]>([]);
  const [dayOptions, setDayOptions] = useState<OptionItem[]>([]);
  const [locationOptions, setLocationOptions] = useState<OptionItem[]>([]);

  const isCreateOpen = searchParams.get("create") === "1";

  useEffect(() => {
    Promise.all([fetchCategoryOptions(), fetchDayOptions(), fetchLocationOptions()]).then(
      ([categories, days, locations]) => {
        setCategoryOptions(categories);
        setDayOptions(days);
        setLocationOptions(locations);
      },
    );
  }, []);

  const loadStudies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchStudies(filters);
      setStudies(res.items);
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 목록을 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadStudies();
  }, [loadStudies]);

  const openCreateModal = () => setSearchParams({ create: "1" });
  const closeCreateModal = () => setSearchParams({});

  const handleCreate = async (payload: StudyCreatePayload) => {
    await createStudy(payload);
    closeCreateModal();
    await loadStudies();
  };

  const handleJoin = async (studyId: number) => {
    setJoiningId(studyId);
    try {
      await joinStudy(studyId);
      await loadStudies();
    } catch (err) {
      setError(extractErrorMessage(err, "스터디 참여에 실패했습니다."));
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-gray-900">스터디</h1>
        <Button onClick={openCreateModal}>+ 스터디 만들기</Button>
      </div>

      <div className="card mb-6">
        <StudyFilterBar
          filters={filters}
          onChange={setFilters}
          categoryOptions={categoryOptions}
          dayOptions={dayOptions}
          locationOptions={locationOptions}
        />
      </div>

      {error && <Alert>{error}</Alert>}

      {isLoading ? (
        <Spinner />
      ) : studies.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">조건에 맞는 스터디가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <StudyCard
              key={study.id}
              study={study}
              onJoin={handleJoin}
              joinLoading={joiningId === study.id}
            />
          ))}
        </div>
      )}

      {isCreateOpen && (
        <Modal title="스터디 생성" onClose={closeCreateModal}>
          <StudyForm
            categoryOptions={categoryOptions}
            dayOptions={dayOptions}
            locationOptions={locationOptions}
            onSubmit={handleCreate}
          />
        </Modal>
      )}
    </PageContainer>
  );
}
