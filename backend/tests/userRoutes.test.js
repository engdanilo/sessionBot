// backend/tests/userRoutes.test.js
const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('User Routes', () => {
    let token;
    let userId;

    beforeAll(async () => {
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'userroute',
                email: 'userroute@example.com',
                password: 'password123',
                smsActivateApiKey: 'testapikey'
            });

        console.log('Register Response:', registerRes.body); // Log da resposta do registro

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'userroute',
                password: 'password123'
            });

        token = loginRes.body.token;
        console.log('Token:', token); // Log do token
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await app.close();
    }, 10000);

    it('should create a new user', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'password123',
                smsActivateApiKey: 'testapikey'
            });

        console.log('Create User Response:', res.body); // Log da resposta de criação de usuário

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('user');
        userId = res.body.user._id;
        console.log('User ID:', userId); // Log do ID do usuário
    }, 10000);

    it('should get all users', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${token}`);

        console.log('Get All Users Response:', res.body); // Log da resposta de obter todos os usuários

        expect(res.statusCode).toEqual(200);
        expect(res.body).toBeInstanceOf(Array);
    }, 10000);

    it('should get a user by ID', async () => {
        const res = await request(app)
            .get(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Get User by ID Response:', res.body); // Log da resposta de obter usuário por ID

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('username', 'newuser');
    }, 10000);

    it('should update a user', async () => {
        const res = await request(app)
            .put(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'updateduser',
                email: 'updateduser@example.com'
            });

        console.log('Update User Response:', res.body); // Log da resposta de atualização de usuário

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('username', 'updateduser');
    }, 10000);

    it('should delete a user', async () => {
        const res = await request(app)
            .delete(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Delete User Response:', res.body); // Log da resposta de exclusão de usuário

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'User deleted successfully');
    }, 10000);
});
