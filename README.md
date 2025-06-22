# nx-redis-cache
An nx remote cache implementation using redis. This package is inspired by [nx-remotecache-redis](https://www.npmjs.com/package/nx-remotecache-redis). Therefore big thanks 👍👌🎉 to [SQLExceptionPhil](https://github.com/SQLExceptionPhil). Many ideas are taken from there!
This package uses the new [openapi-spec](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) for custom remote cache implementations. It integrates with nx 21 versions. See [Self Host Cache](https://nx.dev/recipes/running-tasks/self-hosted-caching#open-api-specification) for details.

You can use the cache by installing an npm package to your nx workspace. The package will offer you a possiblity to start a server locally which interacts with a remote redis db instance specified through an env variable.

## 🚀 Quickstart

1. Installing the server and the cli
    ```shell
    npm install nx-redis-cache@latest
    ```
2. Starting the Server
    
    You have to specify a remote redis url env variable to a running redis instance. The example uses a locally running instance. For testing you can use a local redis db by using a docker container. See the [start-local-redis](scripts/start-local-redis.sh) script for details.
    ```shell
    env REDIS_URL=redis://localhost:6379 npx nx-redis-cache start --verbose
    ```

3. Using the server in an nx workspace
    ```shell
    env NX_SELF_HOSTED_REMOTE_CACHE_SERVER=http://127.0.0.1:3000 npx nx run-many -t=build
    ```

4. Stopping the server
    ```shell
    npx nx-redis-cache stop
    ```

## Supported env variables

TODO


