# wallet_management_vue

                        +-----------------+
                        |   Frontend (Vue.js) |
                    +-----------------+
                                |
                                |  API Requests (REST)
                                v
                 +-------------------------------+
                 |              Nginx             |
                 |     (Reverse Proxy, Load       |
                 |      Balancing, Static Files)  |
                 +-------------------------------+
                                |
                                |  Proxy Requests
                                v
                +-------------------------------+
                |           Gunicorn            |
                |      (WSGI Server for Flask)   |
                +-------------------------------+
                |                               |
           +----v----+                      +------v------+
           | PostgreSQL |                   |    Redis    |
           | (Database) |                   | (Cache/Queue)|
           +------------+                   +-------------+

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
