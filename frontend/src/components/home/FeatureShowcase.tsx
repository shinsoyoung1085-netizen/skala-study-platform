import { useNavigate } from "react-router-dom";

interface FeatureCard {
  emoji: string;
  title: string;
  description: string;
  to: string;
}

const FEATURES: FeatureCard[] = [
  {
    emoji: "📍",
    title: "캠퍼스별 스터디 검색",
    description: "판교, 광주, 울산 캠퍼스별 스터디를 상단 탭으로 한눈에 구별하고 검색해보세요.",
    to: "/studies",
  },
  {
    emoji: "💬",
    title: "스터디원 실시간 소통",
    description: "스터디 상세 페이지에서 바로 스터디원들과 실시간으로 대화를 나눠보세요.",
    to: "/studies",
  },
  {
    emoji: "👏",
    title: "우수 모임장 익명 칭찬",
    description: "멋진 모임장님께 부담 없는 소액 포인트와 칭찬 메시지를 익명으로 전달할 수 있어요.",
    to: "/studies",
  },
  {
    emoji: "🚀",
    title: "손쉬운 스터디 개설",
    description: "원하는 주제나 스터디가 없다면 누구나 직접 모임을 개설하고 팀원을 모집해보세요.",
    to: "/studies?create=1",
  },
];

/** 홈 화면 히어로/바로가기 카드 아래에 배치하는 주요 기능 소개 섹션. */
export function FeatureShowcase() {
  const navigate = useNavigate();

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-extrabold text-gray-900">
        ✨ SKALA STUDY에서 이런 것들을 할 수 있어요
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <button
            key={feature.title}
            type="button"
            onClick={() => navigate(feature.to)}
            className="card flex flex-col items-start gap-3 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-xl">
              {feature.emoji}
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{feature.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
