# 기본 이미지로 Fluentd 공식 이미지 사용
FROM fluent/fluentd:v1.14-debian-1 AS fluent


LABEL maintainer="yourname@example.com"

# root 사용자로 전환 (필요한 작업을 수행하기 위해)
USER root

# 플러그인 설치

# git 설치 추가
RUN apt-get update && apt-get install -y \
    autoconf bison build-essential libssl-dev libyaml-dev \
    libreadline6-dev zlib1g-dev libncurses5-dev libffi-dev libgdbm6 libgdbm-dev \
    git curl \ 
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && git clone https://github.com/rbenv/rbenv.git ~/.rbenv \
    && cd ~/.rbenv && src/configure && make -C src \
    && git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build \
    && ~/.rbenv/bin/rbenv install 3.3.0 \
    && ~/.rbenv/bin/rbenv global 3.3.0


ENV PATH="/root/.rbenv/shims:/root/.rbenv/bin:${PATH}"

# 필요한 gem 설치
RUN gem install faraday-net_http -v 3.0.2 && gem install fluent-plugin-elasticsearch


# 사용자 정의 Fluentd 설정 파일을 컨테이너에 복사
COPY ./conf/fluent.conf /fluentd/etc/

# Fluentd의 기본 설정 파일을 사용자 정의 파일로 대체
ENV FLUENTD_CONF="fluent.conf"


# 사용자를 fluent로 변경 (보안상의 이유로)
USER fluent
