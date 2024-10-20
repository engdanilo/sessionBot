jest.mock('telegram-mtproto', () => ({
    Client: jest.fn().mockImplementation(() => ({
        'auth.sendCode': jest.fn().mockResolvedValue({ phone_code_hash: 'mock_hash' }),
        'auth.signIn': jest.fn().mockResolvedValue({ user: { id: 1, first_name: 'Test', last_name: 'User' } }),
        'account.updateProfile': jest.fn().mockResolvedValue({}),
        'account.updateUsername': jest.fn().mockResolvedValue({}),
    })),
}));
