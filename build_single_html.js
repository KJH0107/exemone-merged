#!/usr/bin/env node
/**
 * Next.js static export → 단일 HTML 파일 변환 스크립트
 * 실행: node build_single_html.js
 * 결과: guide_20260415.html (모든 CSS/JS 인라인, file:// 호환)
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'out');
const SOURCE_HTML = path.join(OUT_DIR, 'database', 'index.html');
const OUTPUT_FILE = path.join(__dirname, 'guide_20260415.html');

function readFile(href) {
  const rel = href.replace(/^\//, '');
  const fullPath = path.join(OUT_DIR, rel);
  if (!fs.existsSync(fullPath)) {
    console.warn('  [WARN] 파일 없음:', fullPath);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

// </script> 가 JS 안에 있으면 HTML 파서가 닫아버림 → 이스케이프
function escapeScript(js) {
  return js.replace(/<\/script>/gi, '<\\/script>');
}

console.log('=== 단일 HTML 빌드 시작 ===');

let html = fs.readFileSync(SOURCE_HTML, 'utf8');
console.log('소스 HTML 크기:', html.length, 'bytes');

// 1. CSS <link rel="stylesheet"> → <style> 인라인
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="(\/_next\/static\/css\/[^"]+)"[^/]*(\/?)>/g,
  (match, href) => {
    const css = readFile(href);
    if (!css) return '';
    console.log('  CSS 인라인:', href.split('/').pop(), `(${css.length} bytes)`);
    return `<style data-href="${href}">${css}</style>`;
  }
);

// 2. <link rel="preload"> 제거 (인라인이므로 불필요)
html = html.replace(/<link\s+rel="preload"[^>]*\/>/g, '');

// 3. JS <script src="..."> → 인라인 <script>
// 패턴: <script src="..." async=""></script> 또는 noModule=""
html = html.replace(
  /<script\s+src="(\/_next\/static\/chunks\/[^"]+)"([^>]*)><\/script>/g,
  (match, href, attrs) => {
    const js = readFile(href);
    if (!js) {
      console.warn('  [SKIP]', href);
      return '';
    }
    const safeJs = escapeScript(js);
    console.log('  JS 인라인:', href.split('/').pop(), `(${js.length} bytes)${attrs.trim() ? ' [' + attrs.trim() + ']' : ''}`);
    return `<script${attrs}>${safeJs}</script>`;
  }
);

// 4. file:// 호환 패치 삽입 — <body> 태그 직후
//    history.replaceState로 /database/ 경로를 흉내내어
//    usePathname()이 올바른 값을 반환하도록 함
const FILE_COMPAT_PATCH = `<script>
/* file:// 프로토콜 호환 패치 */
(function() {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    try {
      history.replaceState({}, '', '/database/');
    } catch(e) {}
  }
})();
</script>`;

html = html.replace('<body>', '<body>' + FILE_COMPAT_PATCH);

// 5. RSC 데이터 내 /_next/static/css/ 링크 힌트는 실패해도 앱에 영향 없음
//    (CSS가 이미 <style>로 인라인되어 있으므로 링크 로딩 실패는 무해)

// 6. 결과 저장
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
const finalSize = fs.statSync(OUTPUT_FILE).size;

console.log('\n=== 빌드 완료 ===');
console.log('출력:', OUTPUT_FILE);
console.log('크기:', (finalSize / 1024 / 1024).toFixed(2), 'MB');
console.log('\n파일을 브라우저로 열어 테스트하세요.');
