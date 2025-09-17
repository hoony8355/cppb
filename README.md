
# GitHub Pages용 초간단 정적 블로그 (쿠팡 파트너스 전용)

마크다운(`.md`) 파일만 `content/posts/` 폴더에 추가하면, GitHub Actions가 자동으로 웹사이트를 빌드하고 배포하는 초경량 정적 블로그입니다. 쿠팡 파트너스와 같은 제휴 마케팅에 최적화되어 있습니다.

## 특징

- **완전 자동화**: `content/posts`에 마크다운 파일을 푸시하기만 하면 GitHub Actions가 모든 것을 처리합니다.
- **초경량 및 초고속**: 런타임 JavaScript가 거의 없어 페이지 로딩 속도가 매우 빠릅니다.
- **SEO 기본 내장**: `title`, `meta description`, `canonical URL`, `Open Graph`, `Twitter Cards`, `JSON-LD` 스키마(Organization, WebSite, BlogPosting, BreadcrumbList)가 자동으로 생성됩니다.
- **쿠팡 파트너스 최적화**: 모든 외부 링크에 `target="_blank" rel="sponsored nofollow ugc"` 속성이 자동으로 추가되어 파트너스 정책을 준수합니다.
- **쉬운 관리**: 복잡한 설정 없이 `site.config.json` 파일 하나로 사이트 전체 정보를 관리합니다.

## 시작하기

### 1. Repository 설정

1.  이 코드를 당신의 GitHub 계정에 새로운 Repository로 생성(또는 포크)합니다.
2.  `site.config.json` 파일을 열어 `baseUrl` 값을 당신의 GitHub Pages 주소로 수정합니다.
    -   예시: `https://your-username.github.io/your-repo-name`
3.  같은 파일에서 `siteName`, `author` 등 나머지 정보도 당신의 정보에 맞게 수정합니다.

### 2. GitHub Pages 활성화

1.  Repository의 **Settings** > **Pages**로 이동합니다.
2.  **Source** 항목에서 브랜치를 **main**으로, 폴더를 **/docs**로 선택하고 **Save** 버튼을 누릅니다.
3.  잠시 후 사이트가 배포됩니다.

### 3. 첫 포스트 작성하기

1.  `content/posts/` 폴더로 이동합니다.
2.  기존 `sample.md` 파일을 참고하여 새로운 `.md` 파일을 생성합니다.
3.  파일 최상단에 아래와 같은 형식의 '프론트매터(Frontmatter)'를 작성합니다.

```markdown
---
title: "나의 첫 번째 포스트 제목"
description: "이 포스트는 ~에 대한 내용을 담고 있습니다. (120~160자 권장)"
date: "2025-09-17"
updated: "2025-09-18"
slug: "my-first-post"
cover: "/og.jpg"
keywords: ["키워드1", "키워드2"]
products:
  - name: "Apple 2023 맥북 프로 14"
    url: "https://link.coupang.com/a/XXXXXX"
    image: "https://thumbnail10.coupangcdn.com/thumbnails/remote/230x230ex/image/retail/images/2023/01/25/10/2/e535872a-43b6-434a-92a8-121513907101.jpg"
    price: 2170000
    currency: "KRW"
---

여기에 마크다운으로 포스트 본문을 작성합니다.

- 목록도 쓸 수 있고
- **굵은 글씨**나 *기울임*도 가능합니다.

쿠팡 파트너스 링크는 본문에 자유롭게 추가할 수 있습니다.
[여기를 클릭하여 상품 보기](https://link.coupang.com/a/YYYYYY)
```

4.  작성이 완료되면 변경사항을 `git commit` 하고 `git push` 합니다.
5.  GitHub의 **Actions** 탭으로 가면 빌드 및 배포 과정이 자동으로 실행되는 것을 확인할 수 있습니다.
6.  액션이 완료되면 몇 분 내로 당신의 블로그에 새 글이 반영됩니다.

## 파일 구조

- **`content/posts/`**: 블로그 포스트(.md)를 저장하는 곳입니다. **당신이 주로 작업할 폴더입니다.**
- **`scripts/build.mjs`**: 사이트를 빌드하는 Node.js 스크립트입니다. (수정 불필요)
- **`src/`**: 웹사이트의 템플릿(`layout.html`, `post.html`)과 스타일(`styles.css`)이 들어있습니다. 디자인을 변경하고 싶을 때 이 폴더의 파일을 수정하세요.
- **`public/`**: `favicon.ico`, 대표 이미지(`og.jpg`) 등 정적 파일을 보관합니다. 여기에 파일을 넣으면 빌드 시 `/docs` 폴더로 복사됩니다.
- **`docs/`**: 빌드 결과물이 저장되는 폴더입니다. GitHub Actions가 이 폴더의 내용을 덮어쓰므로 **직접 수정하지 마세요.**
- **`site.config.json`**: 사이트 전역 설정 파일입니다.
- **`.github/workflows/build.yml`**: GitHub Actions 워크플로우 파일입니다. (수정 불필요)

## 프론트매터(Frontmatter) 상세 설명

| 키          | 설명                                                                                                | 필수 | 기본값                                     |
| ----------- | --------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------ |
| `title`     | 포스트 제목. HTML `<title>` 태그와 페이지 `<h1>` 태그에 사용됩니다.                                | 예   | -                                          |
| `description` | 포스트 요약. `meta description` 태그와 홈페이지의 포스트 카드에 사용됩니다. (120~160자 권장)      | 예   | -                                          |
| `date`      | 포스트 발행일. `YYYY-MM-DD` 형식으로 작성합니다.                                                   | 예   | -                                          |
| `updated`   | 포스트 수정일. 없으면 `date` 값으로 대체됩니다.                                                    | 아니오 | `date` 값                                    |
| `slug`      | 포스트의 URL 경로. 없으면 파일명(확장자 제외)으로 자동 생성됩니다. (예: `my-post`)                   | 아니오 | 파일명                                     |
| `cover`     | 포스트의 대표 이미지 경로. Open Graph 태그에 사용됩니다.                                           | 아니오 | `site.config.json`의 `defaultImage`      |
| `keywords`  | `meta keywords` 태그에 들어갈 키워드 배열.                                                           | 아니오 | 없음                                       |
| `products`  | 쿠팡 상품 카드 목록. 포스트 본문 상단에 렌더링됩니다.                                              | 아니오 | 없음                                       |
