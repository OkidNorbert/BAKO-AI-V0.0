/**
 * BAKO-AI Centralized Mock Data
 * This file contains all the hardcoded data used when MOCK_AUTH_ENABLED is true.
 */

export const MOCK_TRAINING_VIDEOS = [
    {
        id: '1',
        title: 'Shooting Practice',
        uploadedAt: new Date().toISOString(),
        status: 'analyzed',
        thumbnailUrl: null
    },
    {
        id: '2',
        title: 'Free Throw Form',
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'processing',
        thumbnailUrl: null
    },
    {
        id: '3',
        title: 'Dribbling Drills',
        uploadedAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'pending',
        thumbnailUrl: null
    }
];

export const MOCK_TRAINING_HISTORY = [
    {
        id: '1',
        type: 'shooting',
        title: 'Late Night Shooting',
        date: new Date().toISOString(),
        description: 'Practicing 3-pointers'
    },
    {
        id: '2',
        type: 'dribbling',
        title: 'Crossover Mastery',
        date: new Date(Date.now() - 86400000).toISOString(),
        description: 'Focusing on left hand'
    }
];

export const MOCK_PERFORMANCE_METRICS = {
    shootingAccuracy: 75,
    dribbleSpeed: 8.5,
    verticalJump: 30,
    sprintSpeed: 4.5,
    overallRating: 82,
    improvementRate: 5.2,
    weeklyStats: {
        sessionsCompleted: 12,
        minutesTrained: 450,
        shotsAttempted: 1200,
        shotsMade: 900
    }
};

export const MOCK_SKILL_TRENDS = {
    shooting: [
        { date: 'Mon', value: 70, improvement: 2 },
        { date: 'Tue', value: 72, improvement: 1 },
        { date: 'Wed', value: 75, improvement: 3 }
    ],
    dribbling: [
        { date: 'Mon', value: 8.0, improvement: 0.1 },
        { date: 'Tue', value: 8.2, improvement: 0.2 },
        { date: 'Wed', value: 8.5, improvement: 0.3 }
    ],
    defense: [],
    fitness: []
};

export const MOCK_SKILLS = [
    { id: '1', name: 'Shooting', category: 'offense', score: 72, trend: 'up', lastUpdated: new Date().toISOString() },
    { id: '2', name: 'Defense', category: 'defense', score: 68, trend: 'up', lastUpdated: new Date().toISOString() },
    { id: '3', name: 'Playmaking', category: 'offense', score: 65, trend: 'neutral', lastUpdated: new Date().toISOString() },
    { id: '4', name: 'Rebounding', category: 'defense', score: 61, trend: 'up', lastUpdated: new Date().toISOString() },
    { id: '5', name: 'Free Throws', category: 'offense', score: 78, trend: 'up', lastUpdated: new Date().toISOString() }
];

export const MOCK_SKILL_SUMMARY = {
    shooting: 75,
    defense: 70,
    playmaking: 68,
    overall: 72
};

export const MOCK_NOTIFICATIONS = [
    {
        id: '1',
        title: 'Welcome to BAKO!',
        message: 'Your account is ready. Start by uploading a training video.',
        type: 'alert',
        read: false,
        createdAt: new Date(),
    },
    {
        id: '2',
        title: 'Training Tips',
        message: 'Check out our skill analytics to track your progress.',
        type: 'training',
        read: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    }
];

// --- TEAM / ADMIN MOCK DATA ---

export const MOCK_TEAM_STATS = {
    totalPlayers: 24,
    totalMatches: 15,
    matchesAnalyzed: 12,
    winRate: 68,
    performanceData: [
        { name: 'Jan', value: 65 },
        { name: 'Feb', value: 68 },
        { name: 'Mar', value: 72 },
        { name: 'Apr', value: 70 },
        { name: 'May', value: 75 }
    ]
};

export const MOCK_TEAM_ROSTER = [
    { id: '1', firstName: 'John', lastName: 'Doe', position: 'PG', jerseyNumber: '10', age: 19, height: "6'1\"", weight: '180 lbs', status: 'active' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', position: 'SG', jerseyNumber: '24', age: 20, height: "5'11\"", weight: '165 lbs', status: 'active' },
    { id: '3', firstName: 'Mike', lastName: 'Johnson', position: 'SF', jerseyNumber: '33', age: 21, height: "6'7\"", weight: '210 lbs', status: 'injured' },
    { id: '4', firstName: 'Sarah', lastName: 'Williams', position: 'PF', jerseyNumber: '15', age: 19, height: "6'8\"", weight: '225 lbs', status: 'active' },
    { id: '5', firstName: 'Chris', lastName: 'Brown', position: 'C', jerseyNumber: '50', age: 22, height: "7'0\"", weight: '250 lbs', status: 'active' }
];

export const MOCK_TEAM_NOTIFICATIONS = [
    {
        id: 't1',
        title: 'UCU Canons Analysis Ready',
        message: 'The analysis for UCU Canons vs Hawks is complete.',
        type: 'analysis',
        read: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 't2',
        title: 'New Player Joined',
        message: 'A new player has joined the UCU Canons roster.',
        type: 'roster',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
];

export const MOCK_MATCHES = [
    { id: 'm1', title: 'UCU Canons vs. Hawks', opponent: 'Hawks', date: '2025-02-10', status: 'analyzed', result: 'Win', score: '85-78' },
    { id: 'm2', title: 'UCU Canons vs. Eagles', opponent: 'Eagles', date: '2025-02-05', status: 'analyzed', result: 'Loss', score: '72-74' },
    { id: 'm3', title: 'UCU Canons vs. Tigers', opponent: 'Tigers', date: '2025-01-28', status: 'analyzed', result: 'Win', score: '92-88' }
];

export const MOCK_FULL_TEAM_ANALYTICS = {
    teamPerformance: {
        wins: 10,
        losses: 5,
        winPercentage: 67,
        pointsPerGame: 82.5,
        pointsAllowed: 76.2,
        trend: [
            { date: 'Jan', winPercentage: 60 },
            { date: 'Feb', winPercentage: 65 },
            { date: 'Mar', winPercentage: 67 },
            { date: 'Apr', winPercentage: 64 },
            { date: 'May', winPercentage: 67 }
        ]
    },
    playerStats: {
        totalPlayers: 24,
        activePlayers: 20,
        averageRating: 78,
        topPerformers: [
            { name: 'John Doe', position: 'PG', rating: 88, points: 22.5, assists: 8.2 },
            { name: 'Jane Smith', position: 'SG', rating: 85, points: 19.8, rebounds: 4.5 },
            { name: 'Sarah Williams', position: 'PF', rating: 82, points: 14.2, rebounds: 10.5 }
        ],
        positionBreakdown: [
            { position: 'PG', avgRating: 82 },
            { position: 'SG', avgRating: 79 },
            { position: 'SF', avgRating: 75 },
            { position: 'PF', avgRating: 77 },
            { position: 'C', avgRating: 80 }
        ]
    },
    shootingAnalytics: {
        fieldGoalPercentage: 48.5,
        threePointPercentage: 36.2,
        freeThrowPercentage: 78.5,
        shootingTrends: [
            { date: 'Jan', fg: 45, three: 32, ft: 75 },
            { date: 'Feb', fg: 47, three: 34, ft: 77 },
            { date: 'Mar', fg: 48, three: 36, ft: 78 }
        ],
        shotDistribution: [
            { type: 'Inside Paint', percentage: 45 },
            { type: 'Mid-Range', percentage: 25 },
            { type: 'Three-Point', percentage: 30 }
        ]
    },
    gameMetrics: {
        gamesPlayed: 15,
        averageDuration: 48,
        reboundingStats: [
            { type: 'Offensive', count: 12.5 },
            { type: 'Defensive', count: 32.4 }
        ]
    },
    trainingData: {
        sessionsCompleted: 45,
        hoursTrained: 120,
        skillImprovement: [
            { date: 'Jan', shooting: 70, dribbling: 65, defense: 60 },
            { date: 'Feb', shooting: 72, dribbling: 68, defense: 62 },
            { date: 'Mar', shooting: 75, dribbling: 70, defense: 65 }
        ],
        attendanceRate: 92
    }
};
