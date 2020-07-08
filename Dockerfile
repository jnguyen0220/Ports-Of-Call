FROM  node:lts-alpine
LABEL maintainer="Jonny Nguyen<jonny.nguyen@outlook.com>"
WORKDIR /app
COPY . ./app
RUN npm install
EXPOSE 3000
CMD [ "npm", "start" ]