# 비밀 우체통

봉투를 열어 서프라이즈 편지를 전달하는 정적 웹앱입니다.

## 특징

- 받는 사람, 보내는 사람, 편지 내용을 입력해 공유 링크 생성
- 링크를 받은 사람은 봉투를 눌러 편지 확인
- 서버 저장 없이 URL fragment에 편지 데이터 저장
- 만든 편지 링크는 제작자 브라우저의 localStorage에만 보관
- 장미, 세이지, 밤하늘 3개 테마

## 개발

```bash
npm install
npm test
python3 -m http.server 43127
npm run test:e2e
```
