const express = require('express');

const app = express();

const accounts = [];

app.listen(3333);

app.patch("/accounts", (request, response) => {
  return response.json();
})
