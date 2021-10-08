FROM enspirit/webspicy:0.20.8

COPY tests /home/app/tests
COPY support /home/app/support
COPY config.rb /home/app/config.rb
COPY schema.fio /home/app/schema.fio

CMD ["webspicy", "config.rb"]
