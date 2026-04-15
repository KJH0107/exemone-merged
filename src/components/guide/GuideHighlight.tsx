'use client'
import { useGuideStore } from '@/stores/guideStore'

interface Props {
  id: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * 가이드 모드에서 특정 기능 영역을 하이라이트하는 래퍼.
 * 가이드 패널에서 해당 id의 기능을 선택하면 파란 테두리 + 배지가 표시됩니다.
 * 가이드 ON 상태에서 클릭하면 해당 기능 가이드가 자동으로 열립니다.
 */
export default function GuideHighlight({ id, children, style }: Props) {
  const { isOpen, activeFeature, setFeature } = useGuideStore()
  const isActive = isOpen && activeFeature === id

  if (!isOpen) return <div style={style}>{children}</div>

  return (
    <div
      // onClickCapture: 내부 버튼/인풋 등 자식 이벤트를 막지 않으면서 가이드 feature 선택
      onClickCapture={() => { if (isOpen) setFeature(id) }}
      style={{
        ...style,
        position: 'relative',
        zIndex: isActive ? 20 : undefined,
        // box-shadow 사용: outline과 달리 overflow:hidden에 잘리지 않음
        boxShadow: isActive
          ? '0 0 0 3px #3b82f6, 0 0 0 6px rgba(59,130,246,.2)'
          : isOpen
          ? '0 0 0 1.5px rgba(59,130,246,.25)'   // 가이드 ON + 비활성: 클릭 가능 암시
          : 'none',
        borderRadius: 8,
        transition: 'box-shadow .2s',
        cursor: isOpen ? 'pointer' : undefined,
      }}>
      {isActive && (
        /* 배지를 요소 안쪽 상단에 배치 — overflow로 화면 밖으로 나가지 않음 */
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 21,
          background: 'rgba(37,99,235,.92)',
          backdropFilter: 'blur(2px)',
          color: '#fff',
          fontSize: 12, fontWeight: 700,
          padding: '6px 14px',
          borderRadius: '8px 8px 0 0',
          pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
          letterSpacing: 0.2,
        }}>
          <span style={{ fontSize: 14 }}>👆</span>
          <span>이 영역을 확인하세요</span>
        </div>
      )}
      {children}
    </div>
  )
}
