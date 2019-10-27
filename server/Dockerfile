FROM ruby:2.6

ENV BUNDLER_VERSION 2.0.2
WORKDIR /app

COPY Gemfile Gemfile.lock ./

RUN gem install bundler
RUN bundle config --global frozen 1
RUN bundle install

COPY app.rb config.ru puma.rb ./
CMD exec bundle exec thin start
