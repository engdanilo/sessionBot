const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');
const authController = require('../controllers/authController'); // Importe o controller

// Mock do authController
jest.mock('../controllers/authController');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('authRoutes', () => {
  it('should register a new user', async () => {
    // Mock da função register do controller
    authController.register.mockResolvedValueOnce({ status: 201, json: jest.fn() });

    const response = await request(app)
      .post('/auth/register')
      .send({
        telegramId: 123456789,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        walletAddress: '0x123456789abcdef',
        apiKey: 'YOUR_API_KEY'
      });

    expect(response.status).toBe(201);
  });

  it('should return 400 if validation fails', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        // Dados inválidos
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      });

    expect(response.status).toBe(400);
  });

  it('should handle errors during registration', async () => {
    // Mock da função register para simular um erro
    authController.register.mockRejectedValueOnce(new Error('Erro ao registrar usuário'));

    const response = await request(app)
      .post('/auth/register')
      .send({
        telegramId: 123456789,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        walletAddress: '0x123456789abcdef',
        apiKey: 'YOUR_API_KEY'
      });

    expect(response.status).toBe(500);
  });
});