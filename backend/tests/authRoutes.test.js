// backend/tests/authRoutes.test.js
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Auth Routes', () => {
    afterAll(async () => {
        await mongoose.connection.close();
        await app.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                smsActivateApiKey: 'testapikey'
            });

        console.log('Register Response:', res.body); // Log da resposta do registro

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'testuser',
                password: 'password123'
            });

        console.log('Login Response:', res.body); // Log da resposta do login

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
