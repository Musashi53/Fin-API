const { request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

const customers = [];

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);
  
  if(!customer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer;
  // Se existir um customer, a função irá dar um next
  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if(operation.type === 'credit') {
      return accumulator + operation.amount;
    } else {
      return accumulator - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if(customerAlreadyExists) {
    return response.status(400).json({ error:"Customer already exists!" });
  }
  
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });

  return response.status(201).send();
});

// app.use(verifyIfExistsAccountCPF);

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.listen(3333);
