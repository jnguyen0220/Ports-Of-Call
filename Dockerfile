FROM  node:lts-alpine
LABEL maintainer="Jonny Nguyen<jonny.nguyen@outlook.com>"
WORKDIR /
COPY . ./
RUN npm install
EXPOSE 3000
CMD [ "npm", "start" ]