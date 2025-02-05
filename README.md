1. Run Redis docker container:
```
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

2. Connect with redis-cli:
```
docker exec -it redis-stack redis-cli
```

3. Persistence in Docker
```
docker run -v /local-data/:/data redis/redis-stack:latest
```