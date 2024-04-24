#  Participatory-Trial



<br>

#### 🏠 배포 주소 : 미정
#### 🔥 작업 로그 : [Notion](https://teamsparta.notion.site/9c0f63d669cd4eeaabf9c42afeabfdb9)
#### 📹 소개 영상 : 미정

-------------------

<br>

# 📝 Intro

* **프로젝트명** : 국민 참여 재판
* **기간** : 2024년 3월 25일 ~ 2024년 5월 1일
* **주제** : 극악무도한 범죄자들의 판결을 실시간 투표로 정하고 , 대법원 api를 통해 판례를 가져와서 죄질에 대한 형량을 국민끼리 투표해보고 , 유머 혹은 정치적 이야기를 재미있게 토론하는 웹사이트입니다. (맥그리거 vs 할머니 500명 맨손으로 케이지에서) , (전수민 vs 김재연 코딩 대결하면 누가 이기나 )
* **주요기능** :<br> 
[투표] Web-Socket을 통한 실시간 찬반투표<br>
<br>

# 👨‍👩‍👧‍👦Team Members

| Position      | Name          |    Github                                         | Tech Blog                               |
|:--------------|:--------------|:--------------------------------------------------|-----------------------------------------|
| Backend       | 김재연        | [APD-Kim](https://github.com/APD-Kim)             |https://velog.io/@lol0620/posts          |
| Backend       | 김성민        | [kimsungmin2](https://github.com/kimsungmin2)     |https://velog.io/@anrl8913/posts         |
| Backend       | 모진영        | [ahwlsqja](https://github.com/ahwlsqja)           |https://velog.io/@bubblegum95           |
| Backend       | 황세민        | [bubblegum95](https://github.com/bubblegum95)     |https://velog.io/@bubblegum95            |
| Backend       | 박재형        | [jaecoder222](https://github.com/jaecoder222)     |https://dev-jacoder222.tistory.com/      |

<br>

# ⚒ Tech Stack

<br>

|분류|기술|분류|기술|
| :-: | :-: | :-: | :-: |
|Runtime|Node.js|Language|TypeScript|
|Framework|Nest.js|DB|PostgreSQL(AWS RDS), Redis|



 
<br>

# 🕸 Architecture

<br>

#  📒 ERD

https://drawsql.app/teams/kim-14/diagrams/3-erd

<br>

# 💣 Troubleshooting

<br>

# 📝Commit Convention

<details>
<summary> Commit Convention 펼쳐보기 </summary>
<div markdown="1">  
  <br>
● 제목은 최대 30글자이하로 작성: ex) feat: Add Key mapping
  <br>
● 본문은 아래에 작성  
<br><br>

--- <타입> 리스트 --- 
```
feat        : 기능 (새로운 기능)  
fix         : 버그 (버그 수정)  
refactor    : 리팩토링  
design      : CSS 등 사용자 UI 디자인 변경  
comment     : 필요한 주석 추가 및 변경  
style       : 스타일 (코드 형식, 세미콜론 추가: 비즈니스 로직에 변경 없음)  
docs        : 문서 수정 (문서 추가, 수정, 삭제, README)  
test        : 테스트 (테스트 코드 추가, 수정, 삭제: 비즈니스 로직에 변경 없음)  
chore       : 기타 변경사항 (빌드 스크립트 수정, assets, 패키지 매니저 등)  
init        : 초기 생성  
rename      : 파일 혹은 폴더명을 수정하거나 옮기는 작업만 한 경우  
remove      : 파일을 삭제하는 작업만 수행한 경우 
```
--- <꼬리말> 필수아닌 옵션 ---   
```
Fixes        : 이슈 수정중 (아직 해결되지 않은 경우)  
Resolves     : 이슈 해결했을 때 사용  
Ref          : 참고할 이슈가 있을 때 사용  
Related to   : 해당 커밋에 관련된 이슈번호 (아직 해결되지 않은 경우)  
ex) Fixes: #47 Related to: #32, #21
```

</div>
</details>

# 🗒️Code Convention

<details>
<summary> Code Convention 펼쳐보기 </summary>
<div markdown="1">  
  <br>

--- Prettier & Eslint 자동 적용 ---   
```
singleQuote: true → 작은 따옴표(') 사용
trailingComma: "all" → 객체 또는 배열의 마지막 요소 뒤에 항상 쉼표(,) 추가
tabWidth: 2 → 들여쓰기 탭의 너비 2
semi: true → 문장의 끝에 항상 세미콜론(;) 추가
arrowParens: "always" → 화살표 함수 매개변수에 항상 괄호(ex, (param)=>expression) 추가 
endOfLine: "auto" → 자동으로 행 종결 문자를 선택하도록 설정(줄 바꿈 문자(\n)→줄 바꿈 문자(\r\n))
```


 
</div>
</details>
<br><br><br>

![header](https://capsule-render.vercel.app/api?type=waving&color=auto&height=200&section=header&text=Thank%20you%20for%20watching&fontSize=50)

Nest is [MIT licensed](LICENSE).
