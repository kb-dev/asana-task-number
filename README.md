# asana-task-number
A webhook server to add an unique task number for each new task

## Configuration

- Create _config.json_ file from _config.sample.json_ with your own credentials data
- Setup a webhook on Asana : [Documentation](https://developers.asana.com/docs/webhooks)  
- HTTP port is on 80 by default, it can be set with **ASANA_PORT** environment variable 

## Docker configuration

If you want to deploy the application with Docker, you can follow these steps:

- Create by copy _data.json_ from _data.sample.json_ (it's mandatory because of the volume)
- Set up your nginx

```
server {
    listen 80;
    listen [::]:80;
    server_name ndd.example.org;
    
    error_log /var/log/nginx/asana.access.log;
    
    client_max_body_size 1M;

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://127.0.0.1:8082/;
        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_redirect off;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

- You can secure your connection with [Let's Encrypt](https://certbot.eff.org/)
- `docker-compose build` to build
- `docker-compose up -d` to execute in background
- `docker-compose logs f` to watch your logs
