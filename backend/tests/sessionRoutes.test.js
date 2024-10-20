// backend/tests/sessionRoutes.test.js
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Session Routes', () => {
    let token;

    beforeAll(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'sessionuser',
                email: 'sessionuser@example.com',
                password: 'password123',
                smsActivateApiKey: 'testapikey'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'sessionuser',
                password: 'password123'
            });

        token = res.body.token;
        console.log('Token:', token); // Log do token
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await app.close();
    });

    it('should create a new session', async () => {
        const res = await request(app)
            .post('/api/sessions/create-session')
            .set('Authorization', `Bearer ${token}`)
            .send({
                countryCode: '0'
            });

        console.log('Session Response:', res.body); // Log da resposta da sessão

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('session');
    });
});
