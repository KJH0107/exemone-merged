// ── 가이드 기능 설명 데이터 ─────────────────────────────────────
// 출처: exemONE 공식 이용가이드 (ClickUp Docs)

export type PageKey = 'home' | 'database' | 'database-detail' | 'performance' | 'alert'

export interface FeatureItem {
  id: string
  label: string
  icon: string
  highlightArea: string   // GuidePreview에서 하이라이트할 영역 ID
  summary: string         // 한 줄 요약
  description: string     // 상세 설명
  tip?: string            // 사용 팁
  steps?: string[]        // 사용 순서 (선택)
  relatedFeatures?: Array<{
    id: string            // 연관 feature ID (같은 pageFeatures 내)
    label: string         // 표시 이름
    reason: string        // 이 기능으로 이어지는 이유 (한 줄)
  }>
}

export interface PageFeatures {
  key: PageKey
  label: string
  icon: string
  description: string
  features: FeatureItem[]
}

// ═══════════════════════════════════════════════════════════════
// HOME 페이지 기능 설명
// ═══════════════════════════════════════════════════════════════
const homeFeatures: PageFeatures = {
  key: 'home',
  label: '홈',
  icon: '🏠',
  description: '알람 요약정보, 타겟 상태 공지사항, 최근 방문 대시보드 등 사용자가 자주 보고 중요하게 보는 데이터들을 한 판으로 구성해 보여주는 화면입니다.',
  features: [
    {
      id: 'status-summary',
      label: '상태 요약 카드',
      icon: '🟦',
      highlightArea: 'status-summary',
      summary: 'DB 인스턴스 전체 현황을 상태별로 한눈에 파악합니다.',
      description: '전체 인스턴스 수와 Active / Warning / Critical / No Signal 상태별 개수를 요약 카드로 보여줍니다. 카드 클릭 시 해당 상태의 인스턴스만 필터링하여 확인할 수 있습니다.',
      tip: 'Critical 카드를 클릭하면 장애 인스턴스만 즉시 필터링됩니다.',
    },
    {
      id: 'widget-custom',
      label: '화면 커스텀',
      icon: '⚙️',
      highlightArea: 'widget-custom',
      summary: '홈 화면에 표시할 위젯을 원하는 대로 구성합니다.',
      description: '어떤 위젯으로 홈 화면을 구성할지 선택이 가능합니다. 위젯을 드래그하여 위치와 크기를 자유롭게 변경할 수 있습니다.',
      tip: '우측 상단 "시작 가이드" 버튼으로 언제든 위젯 구성 온보딩을 다시 시작할 수 있습니다.',
    },
    {
      id: 'recent-dashboard',
      label: '최근 방문 대시보드',
      icon: '📊',
      highlightArea: 'recent-dashboard',
      summary: '자주 사용하는 대시보드에 빠르게 접근합니다.',
      description: '사용자가 최근 방문한 대시보드를 보여줍니다. 즐겨찾기 표시된 대시보드만 필터링하여 볼 수도 있습니다. 목록 버튼을 선택하면 전체 대시보드 목록으로 이동합니다.',
      tip: '자주 사용하는 대시보드에 즐겨찾기를 설정해두면 빠르게 찾을 수 있습니다.',
    },
    {
      id: 'realtime-alert',
      label: '실시간 알람 현황',
      icon: '🔔',
      highlightArea: 'realtime-alert',
      summary: '현재 발생 중인 알람을 실시간으로 확인합니다.',
      description: '현재 발생한 알람 리스트를 한눈에 보여줍니다. 버튼 선택 시 실시간 알람 디테일 화면으로 이동하여 상세 정보를 확인할 수 있습니다.',
      tip: '알람 발생 시 즉시 확인하고 Acknowledged 처리로 팀에 인지 여부를 공유하세요.',
    },
    {
      id: 'alert-summary',
      label: '최근 알람 요약',
      icon: '📋',
      highlightArea: 'alert-summary',
      summary: '설정한 기간 동안의 알람 통계를 요약해서 봅니다.',
      description: '사용자가 설정한 기간 동안의 알람 요약 정보들을 보여줍니다. 기간 선택이 가능하여 일별/주별 트렌드를 파악하는 데 활용할 수 있습니다.',
      tip: '기간을 7일로 설정하면 주간 장애 패턴 파악에 유용합니다.',
    },
    {
      id: 'critical-list',
      label: '장애 인스턴스 목록',
      icon: '🚨',
      highlightArea: 'critical-list',
      summary: 'Critical 상태 인스턴스를 즉시 확인합니다.',
      description: 'CPU / Memory 임계치 초과 또는 세션 과부하로 Critical 상태에 진입한 인스턴스 목록입니다. 인스턴스명 클릭 시 해당 인스턴스 상세 화면으로 바로 이동합니다.',
      tip: '장애 발생 시 이 목록에서 영향 인스턴스를 빠르게 파악하세요.',
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
// DATABASE (오버뷰) 페이지 기능 설명
// 출처: ClickUp > Database > Instance 페이지
// ═══════════════════════════════════════════════════════════════
const databaseFeatures: PageFeatures = {
  key: 'database',
  label: '오버뷰',
  icon: '🗄',
  description: '전체 Instance 관점 기본 모니터링 화면입니다. DB 인스턴스의 상태, 성능 지표, 목록을 통합하여 제공합니다.',
  features: [
    {
      id: 'instance-card',
      label: 'Instance Card',
      icon: '🟦',
      highlightArea: 'summary',
      summary: 'Instance의 상태별 개수를 보여줍니다.',
      description: '전체 / Active / Warning / Critical / No Signal 상태별 인스턴스 수를 카드로 표시합니다. 카드 클릭 시 해당 상태의 인스턴스만 필터링하여 Instance List에 표시됩니다.',
      tip: '카드 숫자를 클릭하면 해당 상태 인스턴스만 즉시 필터링됩니다.',
      relatedFeatures: [
        { id: 'instance-list', label: 'Instance List', reason: '카드 클릭 시 해당 상태가 목록에서 바로 필터링됩니다.' },
        { id: 'filters', label: 'Filters', reason: 'DB 타입·그룹 조합 필터로 더 정밀하게 범위를 좁힐 수 있습니다.' },
      ],
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: '🔽',
      highlightArea: 'filter',
      summary: 'Instance 화면의 Filters 항목을 선택합니다.',
      description: 'DB 타입(PostgreSQL, MySQL, Oracle 등)과 운영 그룹별로 인스턴스를 필터링할 수 있습니다. 복수 선택이 가능하며 조합 필터로 원하는 인스턴스 목록을 빠르게 조회할 수 있습니다.',
      tip: '멀티 선택으로 여러 DB 타입을 동시에 조회할 수 있습니다.',
      relatedFeatures: [
        { id: 'instance-map', label: 'Instance Map', reason: '필터 적용 결과가 헥사 맵에도 즉시 반영됩니다.' },
        { id: 'instance-list', label: 'Instance List', reason: '필터링된 인스턴스가 목록에 표시됩니다.' },
      ],
    },
    {
      id: 'instance-map',
      label: 'Instance Map',
      icon: '🗺',
      highlightArea: 'hexgrid',
      summary: '모니터링 대상별 상태를 헥사 맵으로 보여줍니다.',
      description: '각 DB 인스턴스를 헥사곤(육각형) 아이콘으로 시각화합니다. 색상으로 상태를 직관적으로 파악할 수 있습니다. Active(파랑) / Warning(노랑) / Critical(빨강) / No Signal(회색)으로 구분됩니다.',
      tip: '헥사곤 위에 마우스를 올리면 인스턴스명, CPU, Memory 수치를 미리 볼 수 있습니다.',
      steps: [
        '헥사곤 색상으로 전체 상태 파악',
        '빨간 헥사곤 클릭 → Critical 인스턴스 상세 진입',
        '상세 화면에서 CPU / 세션 추이 확인',
      ],
      relatedFeatures: [
        { id: 'instance-list', label: 'Instance List', reason: '헥사곤 클릭 시 동일한 인스턴스의 상세 목록 정보를 테이블에서 확인할 수 있습니다.' },
      ],
    },
    {
      id: 'instance-list',
      label: 'Instance List',
      icon: '📋',
      highlightArea: 'table',
      summary: 'Instance의 목록을 보여줍니다.',
      description: '모든 DB 인스턴스를 테이블로 표시합니다. 인스턴스명, DB 타입, 그룹, CPU / Memory 사용률, 활성 세션 수, 현재 상태를 한눈에 확인합니다. 컬럼 헤더 클릭으로 정렬이 가능합니다.',
      tip: 'CPU 컬럼 클릭으로 내림차순 정렬 시 부하가 높은 인스턴스를 가장 먼저 확인할 수 있습니다.',
      steps: [
        '목록에서 이상 인스턴스 식별',
        '인스턴스명 클릭 → 상세 모니터링 화면',
        'CPU / Memory 수치, 세션, 상태 집중 확인',
      ],
      relatedFeatures: [
        { id: 'instance-map', label: 'Instance Map', reason: '목록과 맵은 동일 데이터를 다른 시각으로 보여줍니다.' },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE 페이지 기능 설명
// ═══════════════════════════════════════════════════════════════
const performanceFeatures: PageFeatures = {
  key: 'performance',
  label: '성능분석',
  icon: '📈',
  description: 'DB 인스턴스별 성능 지표 추이 분석과 SQL 실행 현황을 제공합니다. 장애 원인 파악 및 쿼리 최적화에 활용합니다.',
  features: [
    {
      id: 'trend-chart',
      label: '트렌드 차트',
      icon: '📈',
      highlightArea: 'scatter',
      summary: 'CPU / Memory / TPS 등 지표의 시계열 추이를 봅니다.',
      description: '선택한 인스턴스의 CPU, Memory, TPS, Active Sessions, IOPS 지표를 시간대별 라인 차트로 표시합니다. 복수 지표를 동시에 표시하여 상관관계를 파악할 수 있습니다.',
      tip: '시간 범위를 "10분"으로 좁히면 장애 발생 시점을 정밀하게 파악할 수 있습니다.',
    },
    {
      id: 'session-dist',
      label: '세션 분포',
      icon: '🟦',
      highlightArea: 'session-dist',
      summary: 'Active / Idle / Lock / Long 세션 분포를 실시간으로 확인합니다.',
      description: 'Active Session, Long Session, Lock Session을 색상으로 구분하여 실시간으로 각 세션 상태의 Count를 확인할 수 있습니다. Lock 세션 증가는 슬로우쿼리 또는 트랜잭션 문제의 신호입니다.',
      tip: 'Lock 세션이 지속 증가하면 해당 쿼리의 트랜잭션 처리 방식을 검토해야 합니다.',
    },
    {
      id: 'top-sql',
      label: 'Top SQL',
      icon: '🗂',
      highlightArea: 'top-sql',
      summary: '실행 횟수/대기시간 기준 상위 SQL 목록을 분석합니다.',
      description: '실행 횟수 및 대기시간 기준으로 상위 SQL을 랭킹합니다. 빈번하게 실행되는 무거운 쿼리가 시스템 부하의 주요 원인인 경우가 많습니다. SQL 텍스트 클릭 시 전체 쿼리와 실행 계획 힌트를 확인합니다.',
      tip: 'Wait Time이 높은 SQL은 인덱스 최적화 또는 쿼리 튜닝의 우선 대상입니다.',
    },
    {
      id: 'slow-query',
      label: 'Slow Query',
      icon: '🐢',
      highlightArea: 'slow-list',
      summary: '임계치를 초과한 쿼리를 실시간으로 수집합니다.',
      description: '실행 시간이 기준치(기본 5초)를 초과한 쿼리를 자동으로 수집합니다. Query Time, Lock Time, Rows Examined 등으로 무거운 쿼리를 식별합니다.',
      tip: 'Rows Examined 수치가 높을수록 풀 스캔이 의심되며 인덱스 점검이 필요합니다.',
      steps: [
        'Query Time 기준 내림차순 정렬',
        '상위 쿼리 SQL 텍스트 확인',
        'Rows Examined와 Rows Sent 비율로 인덱스 효율 판단',
      ],
    },
    {
      id: 'tablespace',
      label: 'Tablespace',
      icon: '💾',
      highlightArea: 'tablespace',
      summary: 'DB 테이블스페이스 사용량과 잔여 공간을 모니터링합니다.',
      description: 'DB 내 테이블스페이스별 데이터/인덱스 사용량과 잔여 공간(Free)을 표시합니다. 잔여 공간이 부족한 경우 확장 또는 데이터 아카이빙이 필요합니다.',
      tip: '사용률 90% 이상인 테이블스페이스에 알람 규칙을 설정해두면 임박 전 사전 대응이 가능합니다.',
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
// ALERT 페이지 기능 설명
// ═══════════════════════════════════════════════════════════════
const alertFeatures: PageFeatures = {
  key: 'alert',
  label: '알람',
  icon: '🔔',
  description: '알람 규칙 설정과 이벤트 이력을 관리합니다. 임계치 초과 시 자동으로 알람이 발생하고 Email / Slack으로 알림을 받을 수 있습니다.',
  features: [
    {
      id: 'alert-status',
      label: '알람 현황',
      icon: '🔴',
      highlightArea: 'alert-list',
      summary: '발화 중 / 확인됨 / 해소됨 알람 현황을 한눈에 봅니다.',
      description: '현재 발화 중(Firing), 담당자가 확인한(Acknowledged), 조건이 해소된(Resolved) 알람 건수를 상태별로 집계합니다. 발화 중인 알람은 즉각적인 확인이 필요합니다.',
      tip: 'Acknowledged 처리로 팀원에게 "내가 보고 있다"는 신호를 보낼 수 있습니다.',
    },
    {
      id: 'alert-event',
      label: '알람 이벤트 목록',
      icon: '📋',
      highlightArea: 'alert-list',
      summary: '발생한 알람 이벤트 이력과 상세 정보를 확인합니다.',
      description: '알람 이벤트별로 규칙명, 대상 인스턴스, 초과된 지표값, 임계치, 발생 시각을 표시합니다. 이벤트 클릭 시 해당 인스턴스의 성능분석 화면으로 바로 이동할 수 있습니다.',
      tip: '알람 이벤트 발생 시각과 성능 차트의 급등 구간을 비교하면 원인 파악에 도움이 됩니다.',
    },
    {
      id: 'alert-rule',
      label: '알람 규칙',
      icon: '⚙️',
      highlightArea: 'alert-rule',
      summary: '어떤 조건에서 알람을 발생시킬지 규칙을 설정합니다.',
      description: '인스턴스별로 지표(CPU, Memory, TPS, 세션 수 등)와 임계 조건(>, <, >=, <=), 임계값, 심각도(Critical/Warning/Info)를 설정합니다. 알람 발생 시 Email / Slack 등 채널로 알림을 받을 수 있습니다.',
      tip: 'CPU 85% / 95% 두 단계로 Warning → Critical 이중 규칙을 설정하면 단계적 대응이 가능합니다.',
      steps: [
        '규칙명, 대상 인스턴스, 모니터링 지표 선택',
        '임계 조건 및 수치 입력 (예: CPU > 85)',
        '심각도 설정 (Critical / Warning / Info)',
        '알림 채널 선택 (Email / Slack)',
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
// DATABASE DETAIL (Instance Detail Slide) 기능 설명
// 출처: ClickUp > Database > Instance > Instance Detail Slide 페이지
// ═══════════════════════════════════════════════════════════════
const databaseDetailFeatures: PageFeatures = {
  key: 'database-detail',
  label: 'Instance Detail',
  icon: '🖥',
  description: 'Instance 맵 또는 목록에서 인스턴스를 클릭하면 열리는 상세 모니터링 슬라이드입니다. 탭별로 정보, 메트릭, 세션, SQL, Lock, 알람, 파라미터를 확인할 수 있습니다.',
  features: [
    {
      id: 'drawer-info',
      label: '정보 탭 (Information)',
      icon: '📄',
      highlightArea: 'drawer-info',
      summary: '인스턴스 Agent·Machine 기본 정보를 확인합니다.',
      description: '선택한 인스턴스의 기본 정보를 보여줍니다. Agent 섹션에는 인스턴스명, 연결 상태, Agent 버전, 인스턴스 그룹명, DB 버전, 기동 시간이 표시됩니다. Machine 섹션에는 호스트명, Host IP, 운영체제, 커널 버전이 표시됩니다.',
      tip: '인스턴스 접속 불가 시 Status와 Agent Version 확인부터 시작하세요.',
      relatedFeatures: [
        { id: 'drawer-metric', label: '메트릭 탭', reason: '기본 정보 확인 후 CPU·Memory 실시간 지표로 이어서 점검합니다.' },
        { id: 'drawer-host-process', label: '호스트 프로세스 목록', reason: 'Agent가 정상인데 응답이 느리다면 OS 레벨 프로세스를 확인하세요.' },
      ],
    },
    {
      id: 'drawer-metric',
      label: '메트릭 탭 (Metric)',
      icon: '📈',
      highlightArea: 'drawer-metric',
      summary: 'CPU, Memory, TPS, Active Session 지표를 시계열로 모니터링합니다.',
      description: '선택한 인스턴스의 핵심 성능 지표를 실시간 차트로 표시합니다. Global Time 설정으로 모니터링 기간을 조절할 수 있으며, 기본값은 최근 5분입니다. CPU Usage, Memory 사용률, TPS(초당 트랜잭션), Active Session 수 등 DB 타입에 맞는 주요 지표가 제공됩니다.',
      tip: 'Global Time을 1~10분으로 좁히면 장애 발생 시점을 정밀하게 파악할 수 있습니다.',
      steps: [
        'Global Time에서 조회 기간 설정 (실시간 또는 과거 구간)',
        'CPU · Memory · TPS 차트에서 급등 구간 확인',
        '이상 구간 시각을 기록하여 Active Session / SQL 탭과 교차 분석',
      ],
      relatedFeatures: [
        { id: 'drawer-active-session', label: '액티브 세션 탭', reason: 'CPU·TPS 급등 시 원인이 되는 세션을 즉시 확인합니다.' },
        { id: 'drawer-alert', label: '알람 탭', reason: '메트릭 임계치 초과 시 발생한 알람 이력과 시각을 교차 분석합니다.' },
      ],
    },
    {
      id: 'drawer-active-session',
      label: '액티브 세션 탭 (Active Session)',
      icon: '🔗',
      highlightArea: 'drawer-active-session',
      summary: '현재 실행 중인 세션 목록과 Wait Event를 실시간 확인합니다.',
      description: '인스턴스에 접속하여 현재 활동 중인 세션 목록을 보여줍니다. PID(Thread ID), 사용자명, 앱명, Client 주소, SQL 수행시간(Elapsed Time), Wait Event, 상태(State)를 확인할 수 있습니다. PID 클릭 시 Session Detail Slide로 이동하여 해당 세션의 이력과 수행 SQL을 상세 분석할 수 있습니다.',
      tip: 'Wait Event가 "Lock"인 세션이 여러 개 보인다면 Lock 정보 탭에서 대기 관계를 확인하세요.',
      steps: [
        '상태(State)가 active인 세션 목록 확인',
        'Elapsed Time이 긴 세션 식별',
        'PID 클릭 → Session Detail Slide에서 SQL 이력 분석',
      ],
      relatedFeatures: [
        { id: 'drawer-sql-list', label: 'SQL 목록 탭', reason: '세션에서 수행 중인 SQL의 전체 성능 통계를 분석합니다.' },
        { id: 'drawer-lock', label: 'Lock 정보 탭', reason: 'Wait Event가 Lock인 세션이 있다면 Lock 관계도를 확인합니다.' },
      ],
    },
    {
      id: 'drawer-sql-list',
      label: 'SQL 목록 탭 (SQL List)',
      icon: '🗂',
      highlightArea: 'drawer-sql-list',
      summary: '인스턴스에서 수행된 SQL의 성능 통계를 분석합니다.',
      description: '인스턴스에서 수행된 SQL의 실행 횟수, 평균 수행시간, 총 수행시간, Buffer Hit 비율 등 성능 통계를 제공합니다. SQL ID 클릭 시 SQL Detail Slide가 열려 Full Text, 실행 계획(Plan), Trend, Sampling 이력을 확인할 수 있습니다.',
      tip: '평균 수행시간(Avg Elapsed)이 높은 SQL을 우선 튜닝 대상으로 삼으세요.',
      steps: [
        'Elapsed Time 기준 내림차순 정렬',
        '상위 SQL ID 클릭 → SQL Detail Slide 진입',
        'Full Text · Plan 탭에서 실행 계획 분석',
      ],
      relatedFeatures: [
        { id: 'drawer-active-session', label: '액티브 세션 탭', reason: '현재 실행 중인 세션이 수행하는 SQL을 세션 단위로 추적합니다.' },
        { id: 'drawer-lock', label: 'Lock 정보 탭', reason: '긴 SQL이 Lock을 유발하는지 Lock 대기 관계에서 확인합니다.' },
      ],
    },
    {
      id: 'drawer-lock',
      label: 'Lock 정보 탭 (Lock Info)',
      icon: '🔒',
      highlightArea: 'drawer-lock',
      summary: 'Lock 대기 세션과 원인 세션의 관계를 파악합니다.',
      description: 'Lock을 보유한 세션(Blocker)과 대기 중인 세션(Waiter) 관계를 테이블로 보여줍니다. Lock이 오랫동안 해소되지 않으면 연쇄 대기가 발생하여 전체 성능 저하로 이어질 수 있습니다. Kill Session 기능으로 원인 세션을 강제 종료할 수 있습니다.',
      tip: 'Lock Waiter 체인이 3개 이상이면 원인 세션(Blocker) 즉시 처리가 필요합니다.',
      relatedFeatures: [
        { id: 'drawer-active-session', label: '액티브 세션 탭', reason: 'Blocker 세션의 PID를 클릭해 해당 세션의 수행 이력을 분석합니다.' },
        { id: 'drawer-alert', label: '알람 탭', reason: 'Lock 지속 시 알람이 발생하며, 발생 시각과 함께 추적합니다.' },
      ],
    },
    {
      id: 'drawer-alert',
      label: '알람 탭 (Alert)',
      icon: '🔔',
      highlightArea: 'drawer-alert',
      summary: '해당 인스턴스에서 발생한 알람 이력을 확인합니다.',
      description: '해당 인스턴스에 설정된 알람 규칙과 발생 이력을 보여줍니다. 알람명, 심각도(Critical/Warning/Info), 발생 시각, 지표값을 확인할 수 있으며, 메트릭 탭 차트와 시각을 비교하여 장애 원인을 분석할 수 있습니다.',
      tip: '알람 발생 시각과 메트릭 탭 차트의 급등 구간을 반드시 교차 확인하세요.',
      relatedFeatures: [
        { id: 'drawer-metric', label: '메트릭 탭', reason: '알람 발생 시각을 메트릭 차트 급등 구간과 교차 분석합니다.' },
      ],
    },
    {
      id: 'drawer-parameter',
      label: '파라미터 탭 (Parameter)',
      icon: '⚙️',
      highlightArea: 'drawer-parameter',
      summary: 'DB 파라미터 설정값을 조회하고 변경 이력을 관리합니다.',
      description: 'DB 인스턴스에 적용된 파라미터 목록과 현재 설정값(Current Value)을 보여줍니다. Parameter Name 클릭 시 Parameter Detail Slide에서 파라미터 상세 설명과 권장값을 확인할 수 있습니다. 우측에 파라미터 목록을 불러온 시각이 표시됩니다.',
      tip: '파라미터 변경 후 반드시 이 탭에서 실제 적용 여부를 확인하세요.',
      relatedFeatures: [
        { id: 'drawer-info', label: '정보 탭', reason: 'DB 버전에 따라 지원 파라미터가 달라지므로 버전 확인 후 참고합니다.' },
        { id: 'drawer-metric', label: '메트릭 탭', reason: '파라미터 변경 후 성능 지표 변화를 메트릭 탭에서 확인합니다.' },
      ],
    },
    {
      id: 'drawer-host-process',
      label: '호스트 프로세스 목록 탭',
      icon: '🖥',
      highlightArea: 'drawer-host-process',
      summary: 'DB 서버 호스트에서 실행 중인 OS 프로세스를 모니터링합니다.',
      description: 'DB 서버 OS 레벨에서 실행 중인 프로세스 목록을 보여줍니다. PID, PPID, 프로세스명, CPU 사용률, 가상/물리 메모리 사용량을 실시간으로 확인합니다. DB 프로세스 외에 비정상적으로 CPU나 메모리를 점유하는 외부 프로세스 탐지에 유용합니다. Process Name으로 검색이 가능합니다.',
      tip: 'DB 쿼리 성능과 무관하게 CPU 사용률이 높다면 이 탭에서 OS 프로세스 점유를 먼저 확인하세요.',
      relatedFeatures: [
        { id: 'drawer-metric', label: '메트릭 탭', reason: 'CPU 급등이 DB 처리량 문제인지 OS 프로세스 문제인지 메트릭과 비교합니다.' },
      ],
    },
  ],
}

// ── 전체 페이지 기능 목록 export ───────────────────────────────
export const PAGE_FEATURES: Record<PageKey, PageFeatures> = {
  home: homeFeatures,
  database: databaseFeatures,
  'database-detail': databaseDetailFeatures,
  performance: performanceFeatures,
  alert: alertFeatures,
}

export const PAGE_LIST = [
  homeFeatures,
  databaseFeatures,
  databaseDetailFeatures,
  performanceFeatures,
  alertFeatures,
]
