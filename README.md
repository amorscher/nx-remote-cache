# nx-redis-cache
An Nx remote cache implementation using Redis. This package is inspired by [nx-remotecache-redis](https://www.npmjs.com/package/nx-remotecache-redis), so a big thanks 👍👌🎉 to [SQLExceptionPhil](https://github.com/SQLExceptionPhil) —many ideas were taken from that project!

This package uses the new [OpenAPI specification](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) for custom remote cache implementations and is compatible with Nx version 21. See [Self-Host Cache](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) for details.

You can use the cache by installing the npm package in your Nx workspace. It provides the ability to start a local server that interacts with a remote Redis database instance, specified via an environment variable.

## 🚀 Quickstart

### 1. Install the server and CLI
    
```shell
npm install nx-redis-cache@latest
```

### 2. Start the server
    
You must set the REDIS_URL environment variable to point to a running Redis instance.
The example below assumes a local Redis server.

For testing, you can spin up Redis in Docker—see [start-local-redis](scripts/start-local-redis.sh) for a one-liner.
```shell
env REDIS_URL=redis://localhost:6379 npx nx-redis-cache start --verbose
```

### 3. Use the server in an Nx workspace
```shell
env NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://127.0.0.1:3000 npx nx run-many -t=build
```

### 4. Stop the server
```shell
npx nx-redis-cache stop
```

## Supported env variables

| Variable                             | Description                                                       |
| ------------------------------------ | ----------------------------------------------------------------- |
| `REDIS_URL`                          | Redis connection URL (e.g., `redis://localhost:6379`)             |




