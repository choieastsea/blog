---
title: (setting) 맥북 초기 설정 기록하기 (homebrew, zsh, powerlevel10k, python)
date: "2024-09-19"
toc: true
summary: "homebrew / 터미널 관련 / 간단한 개발환경 세팅 /기타 맥북 설정"
readTime: true
autonumber: false
showTags: true
tags: [setting, mac, zsh, oh-my-zsh, powerlevel10k, python]
---

10여년간 쌓인 맥북의 데이터가 너무 많아져, 중요한 것들만 남기고 초기화를 진행하였다. 그 과정에서 세팅한 것들을 키워드 위주로 간단하게 정리해놓으려고 한다.

# homebrew

맥북을 사용하는 개발자라면 가장 많이 사용하는 오픈소스 패키지 매니저이다. Ruby라는 언어로 만들어졌으며, [공식 사이트](https://brew.sh/)에서 installation guide를 보고 실행하면 된다.

**실제 프로그램은 각자의 위치**에 설치되지만, `/opt/homebrew` 디렉토리에 *심볼릭 링크(바로가기와 유사)로 저장*된다. 따라서 brew로만 설치한 프로그램들을 **한 곳에다 두고 관리할 수 있다는 점이 장점**이라고 볼 수 있다. 윈도우의 제어판 프로그램에서 한 곳에 프로그램들을 모아볼 수 있고 이를 제거할 수 있는데, brew는 설치/업데이트/삭제가 한 곳에서 가능하니 간편할 때가 많다.

주로 CLI로 실행가능한 프로그램은 `formulae`라고 하며, GUI/폰트/기타 SW는 `cask`라고 한다.

## 주요 명령어

1. 설치

   ````shell
   ❯ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ````

   zsh셸 설정 파일에 추가

   ```shell
   ❯ (echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/{username}/.zprofile
   ❯ eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

2. 프로그램 설치

   - CLI : `brew install {name}` formula 프로그램이라고들...
   - GUI : `brew install --cask {name}`

3. 앱스토어 프로그램 (mas) 설치

   ```shell
   ❯ brew install mas
   
   ❯ mas search {app_name}
   
   ❯ mas install {app_id}
   ```

   카톡같은 것들을 mas로 깔면 된다. app store에서 다운을 받아도 리스트 명령어시 나오는 것도 확인하였다.

   ```
   ❯ mas list
   869223134   KakaoTalk                 (3.7.0)
   1429033973  RunCat                    (11.3)
   1295203466  Microsoft Remote Desktop  (10.9.10)
   441258766   Magnet                    (2.14.0)
   ```

   

4. 기타 명령어

   - 삭제 : brew uninstall / rm

   - 특정 라이브러리 업데이트

   - 위치 포함한 정보 조회 : brew info 

     ```shell
     ❯ brew info pyenv
     ==> pyenv: stable 2.4.12 (bottled), HEAD
     Python version management
     https://github.com/pyenv/pyenv
     Installed
     /opt/homebrew/Cellar/pyenv/2.4.12 (1,230 files, 3.5MB) *
       Poured from bottle using the formulae.brew.sh API on 2024-09-15 at 01:18:23
     From: https://github.com/Homebrew/homebrew-core/blob/HEAD/Formula/p/pyenv.rb
     License: MIT
     ==> Dependencies
     Required: autoconf ✔, openssl@3 ✔, pkg-config ✔, readline ✔
     ==> Options
     --HEAD
     	Install HEAD version
     ==> Analytics
     install: 110,286 (30 days), 333,448 (90 days), 1,219,167 (365 days)
     install-on-request: 109,672 (30 days), 331,389 (90 days), 1,212,881 (365 days)
     build-error: 17 (30 days)
     ```

     

## 주요 프로그램들

첫 날 기준으로 homebrew를 통해 설치한 프로그램들이다. `formulae`의 경우, 의존성에 따라 추가로 몇 개들이 설치되는 것으로 보인다.

```shell
❯ brew list
==> Formulae
abseil		curl		libfido2	m4		nvm		protobuf	rtmpdump	zstd
autoconf	icu4c		libnghttp2	mas		openssl@3	pyenv		sqlite
brotli		libcbor		libssh2		mpdecimal	pipx		python@3.12	xz
ca-certificates	libevent	lz4		mysql@8.0	pkg-config	readline	zlib

==> Casks
aldente			figma			iina			notion			temurin
betterdisplay		firefox			intellij-idea-ce	obsidian		todoist
cheatsheet		github			iterm2			postman			typora
discord			google-chrome		maccy			pycharm-ce		visual-studio-code
docker			hiddenbar		microsoft-edge		sequel-ace		vnc-viewer
```

- aldente

  배터리 관리자. 요즘에는 최적화된 배터리 충전 모드를 제공하므로 굳이 필요하진 않은 것 같다.

- iina

  미디어 플레이어 (맥 기본 플레이어 대체)

- betterdisplay

  display 커스텀 프로그램. 디스플레이 `HiDPI` 설정 등에 유용하게 사용한다.

- cheatsheet

  활성화된 프로그램에서 `cmd`를 길게 누르면 단축키가 제공되도록 한다.

- maccy

  클립보드 기록용. 왔다갔다 복붙을 안해도 된다. 유사하게 `clipy`도 있는데 maccy가 더 직관적이다.

- hiddenbar

  노치 맥북으로 인해 상단바 아이콘이 가려지는 것을 막기 위해 상단바 아이콘의 visibility를 조정할 수 있다.

- sequel-ace

  MySQL workbench의 대체자. 기존 sequel pro의 대체자

- typora

  마크다운 에디터 (유료지만 구독제가 아니라 좋다)



# 터미널 관련

## zsh

맥도 이제 기본으로 zshell(zsh)라고 한다. 따라서 셸 프로그램을 설치할 필요는 없어 보인다.

zsh는 홈 디렉토리 (`~/`)에 `zprofile`과 `zshrc`라는 설정 파일을 실행하는데 차이는 다음과 같다고 한다.

- zprofile : 로그인시 로드
- zshrc : 터미널 세션 초기화시 로드

zshrc에 두고 설정을 바꿀때마다 `source ~/.zshrc`로 값을 적용해주는 것이 일반적이다. 그럼 zshrc 파일의 명령어들이 실행되며 필요한 초기화문들이 실행될 것이다.

## iterm2

맥북의 기본 터미널은 커스텀의 제약이 있어 [iterm](https://iterm2.com/), [warp](https://www.warp.dev/)와 같은 써드 파티 어플리케이션을 많이 사용한다. 오픈소스인 iterm을 설치해보자.

`brew install —cask iterm2`

### theme

https://iterm2colorschemes.com를 참고하여 iterm의 profile>theme에 추가 가능하다.

## oh-my-zsh

[oh-my-zsh](https://ohmyz.sh/)는 zsh를 쉽게 커스텀하기 위한 오픈소스 플러그인이다.

`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"` 하면 `$HOME/.oh-my-zsh`가 생긴다.

*(curl은 brew로 받자 ^_^)

## powerlevel10k

zsh를 관리하기 쉬운 테마로 다룰 수 있게 해준다. 

[공식레포](https://github.com/romkatv/powerlevel10k)를 참고하여 oh my zsh를 사용하는 경우,

 `git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k` 실행하여 설치 가능하다.

설치 후, zshrc에서`ZSH_THEME="powerlevel10k/powerlevel10k"`를 추가해주면 zsh의 테마로 powerlevel10k를 사용하게 된다. 없다면 일일이 zshrc에 추가하고, 설치해줘야 하는 것들을 간편하게 해준다.

최초의 `source ~/.zshrc` 혹은 `p10k configure`로 인터렉티브하게 설정을 진행하면 된다. 완료되면`~/.p10k.zsh`에 설정이 저장될 것이다.

[참고](https://devocean.sk.com/blog/techBoardDetail.do?ID=165667&boardType=techBlog)

# 간단한 개발환경 세팅

## python

나는 파이썬을 좋아해서 파이썬을 가장 먼저 설치할거다!

### pyenv

`pyenv`는 파이썬 버전을 동적으로 바꿀 수 있도록 도와주는 라이브러리이다. 역시 brew를 통해 설치 가능하다.

```shell
❯ brew install pyenv

❯ echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc

❯ echo '[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc

❯ echo 'eval "$(pyenv init -)"' >> ~/.zshrc
```

이후, `pyenv install {version}` 으로 설치하고, `pyenv global {version}`으로 해당 버전을 전역 파이썬으로 사용할 수 있다. 

```shell
❯ which python
/Users/{username}/.pyenv/shims/python
```

**pyenv의 python을 기본으로 사용하고 있음을 확인**하면 완료다.

### poetry

파이썬 의존성 관리 및 패키징을 위해 사용한다. 전역적으로 설치되어 있어야 편하므로, `pipx`를 먼저 설치하고, `poetry`를 설치해주었다.

## node js

`nvm`을 설치하고 버전에 맞게 node를 설치하면 된다. pyenv가 아마 nvm에서 영향을 받은 것 같다.

## java

가장 많이 쓰는 openjdk인 `temurin`을 설치했다.

## vim 설정

나같은 초보개발자는 vim을 잘 사용하지 못하므로, 마우스 스크롤 설정하나만 켜놔도 좋다 !

`:set mouse=n`



# 기타 맥북 설정

## open with visual studio code

vscode가 아니라 xcode로 열릴 때만큼 화날 때가 없다. 또한, finder 디렉터리에서 vscode를 열고 싶을 때 여간 귀찮지 않을 수 없다.

 `automator`를 이용하여 모든 파일에 대해 vscode로 열 수 있는 `Quick Actions`를 추가할 수 있다.

[이 링크를 참고](https://gist.github.com/idleberg/bc65021a736e9139e3e31f7f2c761d5d)하면 될 것이다!



## 한글 백틱 기본 설정

기본적으로 영문은 백틱(`)이 입력되지만 한글은 귀찮다. (option을 같이 눌러줘야함)

원화표시는 자주 사용하지 않으므로 영문과 동일하게 설정을 바꿔주면 마크다운 작성시 편하다.

[이 링크를 참고](https://ani2life.com/wp/?p=1753)하여 실행하였다.



# 정리

프로젝트마다 많은 라이브러리들이 설치가 되고, 온갖 불필요한 다운로드 파일들이 많아지면서 영혼째 옮기는 마이그레이션보다 초기화가 필요할 때가 있다.

확실한 건, 관리 포인트가 적을수록 옮겨서 적용하기도 쉽다는 것이다! 정리해두고, 필요한 파일만 옮길 수 있도록 도움이 되면 좋을 것이다.