#!/bin/bash

CONT_NAME="form-ular"
PORT=8088

if [ ! "$(docker ps -q  -f name=$CONT_NAME)]" ]; then
  if [ "$(docker ps -aq -f status=exited -f name=$CONT_NAME)" ]; then
        docker rm $CONT_NAME
    fi
    docker run -dit --name form-ular -p $PORT:80 -v "$PWD":/usr/local/apache2/htdocs/ httpd:2.4
fi
