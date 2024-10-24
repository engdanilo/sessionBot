const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const userController = require('../controllers/userController');

// Mock do userController
jest.mock('../controllers/userController');

const app = express();
app.use(express.json());
app.use('/user', userRoutes);

describe('userRoutes', () => {
  it('should get user info', async () => {
    // Mock da função getUserInfo
    userController.getUserInfo.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({
        // Dados do usuário
        telegramId: 123456789,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        apiKey: 'YOUR_API_KEY',
        walletAddress: '0x123456789abcdef',
        paid: false,
        paymentExpiration: null
      })
    });

    const response = await request(app)
      .get('/user/me');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('telegramId');
    expect(response.body).toHaveProperty('firstName');
    // ... outras asserções ...
  });

  it('should manage API Key', async () => {
    // Mock da função manageApiKey
    userController.manageApiKey.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ message: 'API Key saved successfully' })
    });

    const response = await request(app)
      .post('/user/api-key')
      .send({ apiKey: 'YOUR_NEW_API_KEY' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'API Key saved successfully' });
  });

  it('should get SMS Activate balance', async () => {
    // Mock da função getSmsActivateBalance
    userController.getSmsActivateBalance.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ balance: 10 })
    });

    const response = await request(app)
      .get('/user/balance');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ balance: 10 });
  });

  // ... outros testes ...
});