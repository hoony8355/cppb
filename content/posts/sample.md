
---
title: "샘플 포스트: 쿠팡 파트너스 블로그 시작하기"
description: "이 샘플 포스트는 쿠팡 파트너스 블로그를 어떻게 작성하는지 보여주기 위한 예시입니다. 프론트매터와 본문 작성법을 확인하세요."
date: "2024-07-21"
updated: "2024-07-22"
slug: "sample-post-how-to-start"
cover: "/og.jpg"
keywords: ["쿠팡 파트너스", "정적 블로그", "GitHub Pages", "샘플"]
products:
  - name: "Apple 2023 맥북 프로 14, M3 8코어 CPU 10코어 GPU, 8GB, 512GB, 스페이스 그레이"
    url: "https://link.coupang.com/a/bCdeFg"
    image: "https://thumbnail10.coupangcdn.com/thumbnails/remote/230x230ex/image/retail/images/2023/11/14/10/7/9f16a7a7-234b-449e-83d8-cf6378e91244.jpg"
    price: 2170000
    currency: "KRW"
  - name: "로지텍 MX Master 3S 무소음 무선 마우스"
    url: "https://link.coupang.com/a/bCdeFg"
    image: "https://thumbnail7.coupangcdn.com/thumbnails/remote/230x230ex/image/retail/images/2022/05/18/16/3/b6339d91-b3b3-4a6c-9159-0a6932599723.jpg"
    price: 132050
    currency: "KRW"
---

이것은 마크다운으로 작성된 샘플 포스트입니다.
이 블로그 시스템은 `content/posts` 폴더에 `.md` 파일을 추가하고 GitHub에 푸시하기만 하면 자동으로 빌드 및 배포됩니다.

## 마크다운 기본 문법

글을 작성할 때는 표준 마크다운 문법을 사용할 수 있습니다.

### 제목

`#`의 개수로 제목의 레벨을 조절할 수 있습니다.

### 목록

- 순서 없는 목록 1
- 순서 없는 목록 2

1. 순서 있는 목록 1
2. 순서 있는 목록 2

### 링크

본문 내에 자유롭게 링크를 추가할 수 있습니다. 쿠팡 파트너스 링크를 포함한 모든 외부 링크는 자동으로 `target="_blank" rel="sponsored nofollow ugc"` 속성이 추가되어 안전하게 제휴 활동을 할 수 있습니다.

[쿠팡 홈페이지로 이동](https://www.coupang.com)

[네이버 홈페이지로 이동](https://www.naver.com)

### 이미지

마크다운 이미지 문법을 사용하여 이미지를 추가할 수 있습니다. 모든 이미지에는 자동으로 `loading="lazy"` 속성이 부여되어 페이지 로딩 성능을 최적화합니다.

![샘플 이미지](https://picsum.photos/800/400)

### 표

다음과 같이 표도 만들 수 있습니다.

| 헤더 1 | 헤더 2 | 헤더 3 |
| ------ | ------ | ------ |
| 내용 1 | 내용 2 | 내용 3 |
| 내용 4 | 내용 5 | 내용 6 |

## 쿠팡 파트너스 상품 카드

포스트 상단의 프론트매터(frontmatter)에 `products` 목록을 추가하면, 본문 시작 부분에 아래와 같이 자동으로 상품 정보 카드가 생성됩니다. 사용자가 클릭하면 바로 구매 페이지로 이동합니다.
