const billingData = {
    target: 820,
    dailyTarget: 41, // 820 / 20
    team: [
        { id: 1, name: "Abigail", profileImg: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400" },
        { id: 2, name: "Carlos", profileImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
        { id: 3, name: "Daniela", profileImg: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" },
        { id: 4, name: "Eduardo", profileImg: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" },
        { id: 5, name: "Fernanda", profileImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400" },
        { id: 6, name: "Gabriel", profileImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" },
        { id: 7, name: "Hilda", profileImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400" }
    ],
    monthlyData: {
        1: [ // Abigail (Updated for Task Priority)
            { month: "January", actual: 234, jobsActual: 234, holidays: 1, workingDays: 19, issues: 0, b31_60: 0, b61_90: 0, b90: 0 },
            { month: "February", actual: 417, jobsActual: 417, holidays: 1, workingDays: 19, issues: 2, b31_60: 0, b61_90: 0, b90: 0 },
            { month: "March", actual: 358, jobsActual: 358, holidays: 1, workingDays: 19, issues: 0, b31_60: 30, b61_90: 0, b90: 0 },
            { month: "April", actual: 336, jobsActual: 336, holidays: 4, workingDays: 16, issues: 1, b31_60: 30, b61_90: 5, b90: 2 },
            { month: "May", actual: 269, jobsActual: 269, holidays: 0, workingDays: 20, issues: 0, b31_60: 15, b61_90: 1, b90: 0 },
            { month: "June", actual: 304, jobsActual: 304, holidays: 1, workingDays: 19, issues: 3, b31_60: 19, b61_90: 1, b90: 0 },
            { month: "July", actual: 364, jobsActual: 364, holidays: 0, workingDays: 20, issues: 0, b31_60: 62, b61_90: 1, b90: 0 },
            { month: "August", actual: 341, jobsActual: 341, holidays: 2, workingDays: 18, issues: 0, b31_60: 30, b61_90: 1, b90: 0 },
            { month: "September", actual: 465, jobsActual: 465, holidays: 1, workingDays: 19, issues: 1, b31_60: 108, b61_90: 39, b90: 13 },
            { month: "October", actual: 604, jobsActual: 604, holidays: 2, workingDays: 18, issues: 0, b31_60: 152, b61_90: 51, b90: 31 },
            { month: "November", actual: 487, jobsActual: 487, holidays: 1, workingDays: 19, issues: 0, b31_60: 106, b61_90: 29, b90: 9 },
            { month: "December", actual: 628, jobsActual: 628, holidays: 1, workingDays: 19, issues: 0, b31_60: 80, b61_90: 20, b90: 5 }
        ],
        2: Array(12).fill(0).map((_, i) => ({ month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i], actual: Math.floor(Math.random() * 800), jobsActual: Math.floor(Math.random() * 800), holidays: 1, workingDays: 19, issues: Math.floor(Math.random() * 3), b31_60: Math.floor(Math.random() * 50), b61_90: Math.floor(Math.random() * 10), b90: Math.floor(Math.random() * 5) })),
        3: Array(12).fill(0).map((_, i) => ({ month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i], actual: Math.floor(Math.random() * 800), jobsActual: Math.floor(Math.random() * 800), holidays: 1, workingDays: 19, issues: Math.floor(Math.random() * 3), b31_60: Math.floor(Math.random() * 50), b61_90: Math.floor(Math.random() * 10), b90: Math.floor(Math.random() * 5) })),
        4: Array(12).fill(0).map((_, i) => ({ month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i], actual: Math.floor(Math.random() * 800), jobsActual: Math.floor(Math.random() * 800), holidays: 1, workingDays: 19, issues: Math.floor(Math.random() * 3), b31_60: Math.floor(Math.random() * 50), b61_90: Math.floor(Math.random() * 10), b90: Math.floor(Math.random() * 5) })),
        5: Array(12).fill(0).map((_, i) => ({ month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i], actual: Math.floor(Math.random() * 800), jobsActual: Math.floor(Math.random() * 800), holidays: 1, workingDays: 19, issues: Math.floor(Math.random() * 3), b31_60: Math.floor(Math.random() * 50), b61_90: Math.floor(Math.random() * 10), b90: Math.floor(Math.random() * 5) })),
        6: Array(12).fill(0).map((_, i) => ({ month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i], actual: Math.floor(Math.random() * 800), jobsActual: Math.floor(Math.random() * 800), holidays: 1, workingDays: 19, issues: Math.floor(Math.random() * 3), b31_60: Math.floor(Math.random() * 50), b61_90: Math.floor(Math.random() * 10), b90: Math.floor(Math.random() * 5) })),
        7: Array(12).fill(0).map((_, i) => ({ month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][i], actual: Math.floor(Math.random() * 800), jobsActual: Math.floor(Math.random() * 800), holidays: 1, workingDays: 19, issues: Math.floor(Math.random() * 3), b31_60: Math.floor(Math.random() * 50), b61_90: Math.floor(Math.random() * 10), b90: Math.floor(Math.random() * 5) }))
    }
};

if (typeof module !== 'undefined') {
    module.exports = billingData;
}
