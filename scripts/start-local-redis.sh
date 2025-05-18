#!/usr/bin/env bash

set -e

CONTAINER_NAME="nx-cache-redis"
REDIS_PORT=6379

# Check if the container exists
if [ "$(docker ps -a -q -f name=$CONTAINER_NAME)" ]; then
  # Container exists
  if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Redis container is already running."
  else
    echo "Starting existing Redis container..."
    docker start $CONTAINER_NAME
    echo "Waiting for Redis to be ready..."
    until docker exec $CONTAINER_NAME redis-cli PING | grep -q PONG; do
      sleep 0.5
    done
  fi
else
  # Container does not exist, create it
  echo "Creating and starting Redis container..."
  docker run -d \
    --name $CONTAINER_NAME \
    -p $REDIS_PORT:6379 \
    redis:7-alpine

  echo "Waiting for Redis to be ready..."
  until docker exec $CONTAINER_NAME redis-cli PING | grep -q PONG; do
    sleep 0.5
  done
fi

echo "Flushing Redis DB..."
docker exec $CONTAINER_NAME redis-cli FLUSHALL

echo "Seeding test data..."

# Example: storing a test key with value
docker exec $CONTAINER_NAME redis-cli SET test:hello "world"
docker exec $CONTAINER_NAME redis-cli SET test:binary "\x01\x02\x03\x04"

echo "Redis is running on localhost:$REDIS_PORT"
echo "Seeded keys:"
docker exec $CONTAINER_NAME redis-cli KEYS "*"