---
title: "(python) poetry 입문과 사용법 (2)"
date: "2024-08-13"
summary: "pyenv와 조합 /poetry 기반 프로젝트 개발하기 / dependency-group"
toc: true
readTime: true
showTags: true
tags: [python, poetry, package manager, pyproject, toml, venv]
---

지난번에는 `poetry`를 이용하여 프로젝트를 시작하고 라이브러리를 추가하는 방법에 대하여 알아보았다. 오늘은 응용할 수 있는 부분들을 정리해보려고 한다.

## pyenv + poetry 조합

`pyproject.toml`을 보면 python의 버전 제약도 명시되어 있는데, 프로젝트마다 독립적인 파이썬 버전을 갖게 하고 싶을 수 있다. 이때 활용할 수 있는 것이 [pyenv](https://github.com/pyenv/pyenv)이다. node의 `nvm`과 유사하게 필요한 버전을 골라서 사용할 수 있다.

### pyenv 훑어보기

pyenv는 python을 실행할 때 환경변수 `PATH`에 <u>python 실행 파일이 아닌 shim 파일</u>(일종의 스크립트 파일인듯 함)위치를 기록하고, shim파일은 <u>특정 버전의 python으로 연결</u> 하여 다양한 버전을 사용할 수 있게 해준다고 한다.

아래와 같이 나온다면 정상 설치&설정된 것이다.

```shell
> which python
/~~/.pyenv/shims/python
```

간단한 명령어를 정리하면,

- pyenv versions : 설치된 파이썬 버전들과 현재 사용하고 있는 버전 리스트
- pyenv install {version} : 특정 버전 설치
- pyenv local {version} : 현재 디렉토리에 해당 버전 설정
- pyenv global {version} : 글로벌 버전 설정 
- pyenv which python : 현재 사용하는 파이썬 실행파일 위치 (PATH)

이정도만 알면 프로젝트마다 python 버전을 바꿔가며 사용하기 매우 편하다!

다음은 특정 디렉토리에 파이썬 버전을 변경하는 예제이다.

```shell
> pyenv versions
  system
* 3.10.14 (set by /~~/.pyenv/version)
  3.11.9
> pyenv local 3.11.9

> pyenv local
3.11.9
> ls -a
. .python-version
> pyenv global
3.10.14 # local만 바뀜
```

local 버전을 설정하면 `.python-version`이라는 파이썬 버전이 들어간 파일을 만들어준다.

### pyenv의 python으로 poetry 가상환경 만들기

poetry를 이용해 특정 파이썬을 이용해 가상환경을 만들기 위해서는 `poetry env use /full/path/to/python`를 입력해주면 된다. `pyenv which python`의 결과를 이용할 수 있겠다.

```shell
> poetry env use $(pyenv which python)
```

가상환경(poetry) + 버전 격리(pyenv)의 조합으로 자유롭게 프로젝트를 향유할 수 있게 되었다!

## poetry install로 설치하기

poetry 프로젝트를 git 등을 통해 가져왔다고 가정하자. 실행하기 위해 프로젝트에 알맞는 버전의 파이썬 가상환경까지 만들었다면, 이제 종속성 라이브러리를 설치할 차례이다.

````shell
> poetry install
````

간단한 명령어로 `pyproject.toml` 혹은 `poetry.lock`에 있는 종속성 라이브러리들을 설치해줄 거이다.

만약 <u>lock 파일이 없다면</u> toml파일을 기반으로 라이브러리 버전들을 resolve하여 <u>lock 파일을 만들고 가상환경에 설치</u>해줄 것이다. (다만 이는 프로젝트 배포자와 다른 환경으로 구축될 확률이 있다) toml파일로부터 lock파일만 만들고 싶다면 `poetry lock` 명령어를 수행하자.

## dependency group

poetry는 기본적으로 한 프로젝트에 하나의 `pyproject.toml`파일을 추구한다. 하지만 환경에 따라 다른 라이브러리를 설치하고 싶은 경우에는 어떻게 할까?

예컨대, fastapi 기반의 웹서비스를 가정해보자. 용량이 적은 배포환경을 위해 `pytest`, `pytest-asyncio`, `aiosqlite` 같은 테스트를 위한 라이브러리들은 빼고 싶을 수 있다. 아니면 테스트 파이프라인을 컨테이너에서 실행할 때, 굳이 문서 배포에서만 필요한 `sphinx-autodoc`은 원하지 않을 수 있다.

기존에는 `requirements.txt`, `requirements-test.txt` 처럼 여러 종속성 파일들을 만들 수 있었지만, poetry에서는 dependency-group를 활용할 수 있다. group명으로는 test, dev 등이 있을 수 있다.

```shell
> poetry add {library명} -G {group명}

> poetry add pytest -G test
```

위 명령어는 test group dependency에 pytest를 추가하고, 설치한다. toml파일을 보자.

```
[tool.poetry.dependencies]
python = "^3.9"
aiohttp = "^3.10.3"


[tool.poetry.group.test.dependencies]
pytest = "^8.3.2"
```

이에 특정 그룹의 종속성만 설치하거나, 그렇지 않게 할 수 있다. 기본적으로 install 명령어는 모든 그룹의 라이브러리를 설치한다.

```
> poetry install --only test
> poetry install --without test
```



이 정도만 알아도 파이썬 프로젝트를 poetry로 진행하는데 큰 문제는 없지만, 제공하는 기능 몇개만 간단하게 알아보자.

1. 별도의 저장소

   기본적으로 `poetry add`은 [pypi](https://pypi.org)라는 저장소에서 라이브러리를 가져온다. 만약 내가 따로 만든 라이브러리를 이용하고 싶다면 `poetry source add {저장소명} {주소}`로 추가할 수 있다. 또한 **저장소의 priority**를 지정하여 라이브러리마다 다른 저장소에서 가져오게 할 수 있다. private 저장소의 경우는 접근 가능한 계정 정보를 등록해야 한다. [참고](https://python-poetry.org/docs/repositories/)

2. 빌드 & 배포

   파이썬 패키지를 직접 만들어서 pypi 혹은 사설 레지스트리에 저장하고 싶을 때, `poetry build`와 `poetry publish`로 가능하다. 이때, toml에 적혀있는 메타데이터가 활용되므로 버전 등을 확인하자.

그 외에도 이런 저런 기능들도 가능하다고 합니다...



## 대안은 없는가 

찾아보니 [hatch](https://hatch.pypa.io/latest/), [Rye](https://rye.astral.sh)라는 패키지 관리자가 있다. 제공하는 기능은 크게 다르지 않겠지만, poetry가 가장 레퍼런스가 많고 문서화가 잘 되어 있다. (그게 가장 좋다는 의미는 아니다)

앞으로 python 기반의 프로젝트를 시작할 때는 `poetry`를 사용해보자 !

화이팅