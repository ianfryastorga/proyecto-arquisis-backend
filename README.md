# Grupo 11 Arquisis Backend

## Consideraciones generales

- Se utilizó Node.js con Koa para el desarrollo de la API.
- Se utilizó Sequelize como ORM para la conexión con la base de datos.
- Nombre del dominio: [grupo11arquisis.live](grupo11arquisis.live)
- URL del frontend (dominio): [https://web.grupo11arquisis.live/](https://web.grupo11arquisis.live/)
- URL de la API (subdominio): [https://api.grupo11arquisis.live](https://api.grupo11arquisis.live)

## Documentación API

### Postgres

1. Inicializar psql: `sudo -u postgres psql`
2. Crear usuario de postgres `sudo -u postgres createuser --superuser [POSTGRES_USER]:`
3. Crear base de datos: `sudo -u postgres createdb [DB_NAME]`
4. Crear clave del usuario: `ALTER USER [POSTGRES_USER] WITH PASSWORD 'POSTGRES_PASSWORD';` (correr dentro del entorno de postgres)
5. Conectarse a la BD: `psql -U [POSTGRES_USER] -d [DB_NAME] -h`

### Entorno Local

#### Variables de entorno

1. Crear archivo `.env` dentro de carpeta `api` con las siguientes variables:
```
DB_USERNAME = <db_username>
DB_PASSWORD = <db_password>
DB_NAME = <db_name>
DB_HOST = localhost
REQUEST_URL = http://localhost:8000
API_URL = http://localhost:3000
```
2. Crear archivo `.env` dentro de carpeta `listener` con las siguientes variables:
```
API_URL = http://localhost:3000
```
3. Crear archivo `.env` dentro de carpeta `requests` con las siguientes variables:
```
API_URL = http://localhost:3000
REQUEST_PORT = 8000
```
4. Crear archivo `.env` dentro de carpeta `validations` con las siguientes variables:
```
API_URL = http://localhost:3000
```

#### Ejecución

Dentro de cada carpeta (`api`, `listener`, `requests`, `validations`) ejecutar los siguientes comandos:
1. Instalar dependencias: `yarn install` / `yarn`
2. Crear base de datos: `yarn sequelize-cli db:create`
3. Correr migraciones: `yarn sequelize-cli db:migrate`
4. Levantar servidores: `yarn start` / `yarn dev` 
 


### Docker

#### Variables de entorno

1. Crear archivo `.env` en la raíz del repositorio con las siguientes variables:
```
POSTGRES_USER = <db_username>
POSTGRES_PASSWORD = <db_password>
POSTGRES_DB = <db_name>
POSTGRES_HOST = db
TZ = "America/Santiago"
```
2. Modificar archivo `.env` dentro de carpeta `api` con las siguientes variables:
```
DB_USERNAME = <db_username>
DB_PASSWORD = <db_password>
DB_NAME = <db_name>
DB_HOST = db
REQUEST_URL = http://requests:3000
API_URL = http://api:3000
```
3. Modificar archivo `.env` dentro de carpeta `listener` con las siguientes variables:
```
API_URL = http://api:3000
```
4. Modificar archivo `.env` dentro de carpeta `requests` con las siguientes variables:
```
API_URL = http://api:3000
REQUEST_PORT = 8000
```
5. Modificar archivo `.env` dentro de carpeta `validations` con las siguientes variables:
```
API_URL = http://api:3000
```

#### Ejecución

(En caso de usar Ubuntu, se debe anteponer `sudo` a los siguientes comandos de docker)
1. Construir imagen: `docker compose build`
2. Levantar contenedores: `docker compose up -d`
3. Correr migraciones dentro del contenedor de la api: `docker compose exec api yarn sequelize-cli db:migrate`
4. Revisar contenedores: `docker compose ps`
5. Revisar logs: `docker compose logs`
6. Detener contenedores: `docker compose down`
7. Detener contendores y eliminar volúmenes: `docker compose down -v`

* También se pueden levantar los contenedores de forma individual con `docker compose up -d [service]` donde `[service]` puede ser `db`, `api`, `listener`, `requests`, `validations`. Recordar siempre levantar primero la base de datos antes que los otros servicios. Y correr las migraciones dentro del contenedor de la api.

## Conexión con Frontend (Local)

### Variables de entorno
Para establecer conexión entre el backend y el frontend, se debe crear un archivo `.env` en la raíz del proyecto de frontend con las siguientes variables:
```
REACT_APP_AUTH0_DOMAIN = <auth0_domain>
REACT_APP_AUTH0_CLIENT_ID = <auth0_client_id>

BACKEND_URL = <backend_url>
```

* `REACT_APP_AUTH0_DOMAIN` y `REACT_APP_AUTH0_CLIENT_ID` son las credenciales de autenticación de Auth0.
* `BACKEND_URL` es la URL del backend, en este caso `http://localhost:3000`.
* Si se conecta con el backend en producción, se debe cambiar `BACKEND_URL` por la URL `https://api.grupo11arquisis.live`.

### Ejecución

1. Instalar dependencias: `yarn install` / `yarn`
2. Levantar servidor: `yarn start` / `yarn dev`


## Pipeline CI (GitHub Actions)

* Se creó un pipeline de CI en Github Actions que se encarga de ejecutar un linter en cada uno de los proyectos del repositorio cuando se hace pull request en las ramas `main` y `develop`.

#### Pasos para replicar Pipeline CI

1. Crear un archivo `.yml` dentro de la carpeta `.github/workflows` en el repositorio con el siguiente contenido:
```yml
name: Lint Workflow

on:
  pull_request:
    branches:
      - develop
      - main

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn install

      - name: Lint with yarn
        run: yarn lint

      - name: echo
        run: echo "Linting complete!"
```
* Este archivo sigue los siguientes pasos:
  1. Se ejecuta en cada pull request a las ramas `main` y `develop`.
  2. Se define el trabajo `Lint` que corre en una máquina virtual de ubuntu.
  3. Se define una matriz que permite ejecutar los pasos del trabajo en paralelo para cada proyecto.
  4. Se verifica el código del repositorio.
  5. Se configura Node.js.
  6. Se instalan las dependencias del proyecto en cada proyecto.
  7. Se corre el linter en cada proyecto.
  8. Se imprime un mensaje en consola al finalizar el linter.

2. Agregar ESLint a cada proyecto corriendo los siguientes comandos:
`yarn add eslint@8 --dev`
`yarn add eslint-config-airbnb-base --dev`
`yarn add eslint-plugin-import --dev`
3. Crear un archivo `.eslintrc.js` en la raíz de cada proyecto y agregar configuración y reglas de ESLint.
4. Agregar los scripts de linter en el `package.json` de cada proyecto:
```json
"scripts": {
  "lint": "eslint .",
    "lint:fix": "eslint . --fix"
}
```
5. Crear un pull request a las ramas `main` o `develop` y verificar que el pipeline de CI se ejecute correctamente.
