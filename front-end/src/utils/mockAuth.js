/**
 * Mock Authentication System
 * 
 * This module provides mock authentication for frontend testing.
 * 
 * TO DISABLE: Set MOCK_AUTH_ENABLED to false when connecting to real backend
 */

// ============================================
// TOGGLE THIS FLAG TO ENABLE/DISABLE MOCK AUTH
// ============================================
export const MOCK_AUTH_ENABLED = true;

// Mock user storage key
const MOCK_USERS_KEY = 'mockUsers';

// Get stored mock users
const getMockUsers = () => {
    const users = localStorage.getItem(MOCK_USERS_KEY);
    return users ? JSON.parse(users) : [];
};

// Save mock users
const saveMockUsers = (users) => {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

// Generate a simple mock JWT token
const generateMockToken = (user) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
};

// Mock register function
export const mockRegister = async (userData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getMockUsers();

    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
        throw {
            response: {
                data: { message: 'Email already registered' }
            }
        };
    }

    // Create new user
    const newUser = {
        id: `mock-${Date.now()}`,
        email: userData.email,
        password: userData.password, // In real app, this would be hashed
        name: userData.name,
        role: userData.role || 'player',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveMockUsers(users);

    // Generate tokens
    const accessToken = generateMockToken(newUser);
    const refreshToken = `refresh-${Date.now()}`;

    return {
        data: {
            accessToken,
            refreshToken,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        }
    };
};

// Mock login function
export const mockLogin = async (email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getMockUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        throw {
            response: {
                data: { message: 'Invalid email or password' }
            }
        };
    }

    // Generate tokens
    const accessToken = generateMockToken(user);
    const refreshToken = `refresh-${Date.now()}`;

    return {
        data: {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        }
    };
};

// Mock logout function
export const mockLogout = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: { success: true } };
};

console.log('🔧 Mock Auth Mode:', MOCK_AUTH_ENABLED ? 'ENABLED' : 'DISABLED');
