FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

# Corre las migraciones pendientes antes de arrancar el servidor, en cada
# despliegue (cada vez que el contenedor arranca con una imagen nueva). Los
# seeders NO se corren aca a propósito: varios (seeders/*.js) hacen
# bulkInsert directo sin verificar si el dato ya existe, asi que ejecutarlos
# de nuevo en cada despliegue fallaria o duplicaria filas. La siembra inicial
# real ya la hace utils/bootstrap.js -> bootstrapInitialData(), que SI es
# idempotente (revisa si ya hay usuarios antes de crear nada) y ya se llama
# automaticamente al iniciar index.js.
CMD ["sh", "-c", "npx sequelize-cli db:migrate && npm start"]
