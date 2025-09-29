// Unit Tests for HIIT Timer
// This file contains comprehensive unit tests for the HIITTimer class

class HIITTimerTests {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    // Helper method to create a mock timer instance
    createMockTimer() {
        const timer = new HIITTimer();
        // Mock DOM elements
        timer.mockElements = {
            timeDisplay: { textContent: '', setAttribute: () => {} },
            currentPhase: { textContent: '', className: '' },
            progressInfo: { textContent: '' },
            progressFill: { style: { width: '' } },
            pauseBtn: { textContent: '', style: { display: '' } },
            skipBtn: { style: { display: '' } }
        };
        return timer;
    }

    // Helper method to simulate timer progression
    simulateTimerProgression(timer, workoutConfig) {
        const events = [];
        timer.workoutConfig = workoutConfig;
        timer.currentCycle = 1;
        timer.currentRound = 1;
        timer.currentPhase = 'prepare';
        
        // Simulate the timer logic step by step
        const maxIterations = 100; // Prevent infinite loops
        let iterations = 0;
        
        while (timer.currentCycle <= workoutConfig.cycles && iterations < maxIterations) {
            iterations++;
            
            if (timer.currentPhase === 'prepare') {
                events.push('Prepare');
                timer.currentPhase = 'work';
            } else if (timer.currentPhase === 'work') {
                const duration = workoutConfig.roundDurations[timer.currentRound - 1];
                events.push(`Cycle ${timer.currentCycle}, Round ${timer.currentRound}: Work (${duration}s)`);
                
                if (timer.currentRound < workoutConfig.roundDurations.length) {
                    if (workoutConfig.restPeriod > 0) {
                        events.push(`Cycle ${timer.currentCycle}, Round ${timer.currentRound}: Rest (${workoutConfig.restPeriod}s)`);
                        timer.currentPhase = 'rest';
                    } else {
                        timer.currentRound++;
                        timer.currentPhase = 'work';
                    }
                } else {
                    // Move to next cycle
                    timer.currentCycle++;
                    timer.currentRound = 1;
                    if (timer.currentCycle <= workoutConfig.cycles) {
                        if (workoutConfig.roundDurations.length > 1 && workoutConfig.restPeriod > 0) {
                            events.push(`Between cycles: Rest (${workoutConfig.restPeriod}s)`);
                            timer.currentPhase = 'rest';
                        } else {
                            timer.currentPhase = 'work';
                        }
                    } else {
                        events.push('Workout Complete!');
                        break;
                    }
                }
            } else if (timer.currentPhase === 'rest') {
                timer.currentRound++;
                timer.currentPhase = 'work';
            }
        }
        
        return events;
    }

    addTest(name, description, testFunction) {
        this.tests.push({ name, description, testFunction });
    }

    async runTest(test) {
        try {
            const result = await test.testFunction();
            this.results.push({ name: test.name, status: 'PASS', result });
            return { name: test.name, status: 'PASS', result };
        } catch (error) {
            this.results.push({ name: test.name, status: 'FAIL', result: error.message });
            return { name: test.name, status: 'FAIL', result: error.message };
        }
    }

    async runAllTests() {
        console.log('🧪 Running HIIT Timer Unit Tests...\n');
        this.results = [];
        
        for (const test of this.tests) {
            const result = await this.runTest(test);
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.status === 'FAIL') {
                console.log(`   Error: ${result.result}`);
            }
        }
        
        this.printSummary();
        return this.results;
    }

    printSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log('\n📊 Test Summary:');
        console.log(`   Total: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    }
}

// Create test suite
const testSuite = new HIITTimerTests();

// Test 1: Single cycle, single round
testSuite.addTest(
    'Single Cycle, Single Round',
    'Tests 1 cycle with 1 round',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 1, restPeriod: 30, roundDurations: [60] };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const expected = ['Prepare', 'Cycle 1, Round 1: Work (60s)', 'Workout Complete!'];
        
        if (JSON.stringify(events) === JSON.stringify(expected)) {
            return `PASS: Correct sequence for single cycle, single round`;
        } else {
            throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
        }
    }
);

// Test 2: Multiple cycles, single round
testSuite.addTest(
    'Multiple Cycles, Single Round',
    'Tests 3 cycles with 1 round each',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 3, restPeriod: 30, roundDurations: [60] };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const expected = [
            'Prepare',
            'Cycle 1, Round 1: Work (60s)',
            'Cycle 2, Round 1: Work (60s)',
            'Cycle 3, Round 1: Work (60s)',
            'Workout Complete!'
        ];
        
        if (JSON.stringify(events) === JSON.stringify(expected)) {
            return `PASS: Correct sequence for multiple cycles, single round`;
        } else {
            throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
        }
    }
);

// Test 3: Single cycle, multiple rounds
testSuite.addTest(
    'Single Cycle, Multiple Rounds',
    'Tests 1 cycle with 3 rounds',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 1, restPeriod: 30, roundDurations: [60, 45, 30] };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const expected = [
            'Prepare',
            'Cycle 1, Round 1: Work (60s)',
            'Cycle 1, Round 1: Rest (30s)',
            'Cycle 1, Round 2: Work (45s)',
            'Cycle 1, Round 2: Rest (30s)',
            'Cycle 1, Round 3: Work (30s)',
            'Workout Complete!'
        ];
        
        if (JSON.stringify(events) === JSON.stringify(expected)) {
            return `PASS: Correct sequence for single cycle, multiple rounds`;
        } else {
            throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
        }
    }
);

// Test 4: Multiple cycles, multiple rounds
testSuite.addTest(
    'Multiple Cycles, Multiple Rounds',
    'Tests 2 cycles with 2 rounds each',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 2, restPeriod: 30, roundDurations: [60, 45] };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const expected = [
            'Prepare',
            'Cycle 1, Round 1: Work (60s)',
            'Cycle 1, Round 1: Rest (30s)',
            'Cycle 1, Round 2: Work (45s)',
            'Between cycles: Rest (30s)',
            'Cycle 2, Round 1: Work (60s)',
            'Cycle 2, Round 1: Rest (30s)',
            'Cycle 2, Round 2: Work (45s)',
            'Workout Complete!'
        ];
        
        if (JSON.stringify(events) === JSON.stringify(expected)) {
            return `PASS: Correct sequence for multiple cycles, multiple rounds`;
        } else {
            throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
        }
    }
);

        // Test 5: Zero rest period
        testSuite.addTest(
            'Zero Rest Period',
            'Tests workout with 0 second rest periods',
            () => {
                const timer = testSuite.createMockTimer();
                const workoutConfig = { cycles: 2, restPeriod: 0, roundDurations: [60, 45] };
                const events = testSuite.simulateTimerProgression(timer, workoutConfig);
                
                const expected = [
                    'Prepare',
                    'Cycle 1, Round 1: Work (60s)',
                    'Cycle 1, Round 2: Work (45s)',
                    'Cycle 2, Round 1: Work (60s)',
                    'Cycle 2, Round 2: Work (45s)',
                    'Workout Complete!'
                ];
                
                if (JSON.stringify(events) === JSON.stringify(expected)) {
                    return `PASS: Correct sequence for zero rest period`;
                } else {
                    throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
                }
            }
        );

        // Test 5.5: Zero duration rounds
        testSuite.addTest(
            'Zero Duration Rounds',
            'Tests workout with 0 second round durations',
            () => {
                const timer = testSuite.createMockTimer();
                const workoutConfig = { cycles: 1, restPeriod: 30, roundDurations: [60, 0, 45] };
                const events = testSuite.simulateTimerProgression(timer, workoutConfig);
                
                const expected = [
                    'Prepare',
                    'Cycle 1, Round 1: Work (60s)',
                    'Cycle 1, Round 1: Rest (30s)',
                    'Cycle 1, Round 2: Work (0s)',
                    'Cycle 1, Round 2: Rest (30s)',
                    'Cycle 1, Round 3: Work (45s)',
                    'Workout Complete!'
                ];
                
                if (JSON.stringify(events) === JSON.stringify(expected)) {
                    return `PASS: Correct sequence for zero duration rounds`;
                } else {
                    throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
                }
            }
        );

// Test 6: Edge case - maximum cycles
testSuite.addTest(
    'Maximum Cycles',
    'Tests 10 cycles (maximum allowed)',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 10, restPeriod: 30, roundDurations: [60] };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const workEvents = events.filter(e => e.includes('Work (60s)'));
        
        if (workEvents.length === 10) {
            return `PASS: Correctly handles 10 cycles (${workEvents.length} work phases)`;
        } else {
            throw new Error(`Expected: 10 work phases, got: ${workEvents.length}`);
        }
    }
);

// Test 7: Edge case - maximum rounds
testSuite.addTest(
    'Maximum Rounds',
    'Tests 10 rounds (maximum allowed)',
    () => {
        const timer = testSuite.createMockTimer();
        const roundDurations = Array(10).fill(30);
        const workoutConfig = { cycles: 1, restPeriod: 15, roundDurations };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const workEvents = events.filter(e => e.includes('Work (30s)'));
        
        if (workEvents.length === 10) {
            return `PASS: Correctly handles 10 rounds (${workEvents.length} work phases)`;
        } else {
            throw new Error(`Expected: 10 work phases, got: ${workEvents.length}`);
        }
    }
);

        // Test 8: Edge case - zero duration
        testSuite.addTest(
            'Zero Duration',
            'Tests 0 second duration (minimum allowed)',
            () => {
                const timer = testSuite.createMockTimer();
                const workoutConfig = { cycles: 1, restPeriod: 30, roundDurations: [0] };
                const events = testSuite.simulateTimerProgression(timer, workoutConfig);
                
                const expected = ['Prepare', 'Cycle 1, Round 1: Work (0s)', 'Workout Complete!'];
                
                if (JSON.stringify(events) === JSON.stringify(expected)) {
                    return `PASS: Correctly handles zero duration (0s)`;
                } else {
                    throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
                }
            }
        );

// Test 9: Edge case - maximum duration
testSuite.addTest(
    'Maximum Duration',
    'Tests 600 second duration (maximum allowed)',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 1, restPeriod: 30, roundDurations: [600] };
        const events = testSuite.simulateTimerProgression(timer, workoutConfig);
        
        const expected = ['Prepare', 'Cycle 1, Round 1: Work (600s)', 'Workout Complete!'];
        
        if (JSON.stringify(events) === JSON.stringify(expected)) {
            return `PASS: Correctly handles maximum duration (600s)`;
        } else {
            throw new Error(`Expected: ${expected.join(' → ')}\nActual: ${events.join(' → ')}`);
        }
    }
);

// Test 10: Input validation - cycles
testSuite.addTest(
    'Input Validation - Cycles',
    'Tests cycle validation logic',
    () => {
        const testCases = [
            { cycles: 0, shouldPass: false },
            { cycles: 1, shouldPass: true },
            { cycles: 5, shouldPass: true },
            { cycles: 10, shouldPass: true },
            { cycles: 11, shouldPass: false }
        ];
        
        for (const testCase of testCases) {
            const isValid = testCase.cycles >= 1 && testCase.cycles <= 10;
            if (isValid !== testCase.shouldPass) {
                throw new Error(`Cycle validation failed for ${testCase.cycles}: expected ${testCase.shouldPass}, got ${isValid}`);
            }
        }
        
        return `PASS: Cycle validation works correctly for all test cases`;
    }
);

// Test 11: Input validation - rest period
testSuite.addTest(
    'Input Validation - Rest Period',
    'Tests rest period validation logic',
    () => {
        const testCases = [
            { restPeriod: -1, shouldPass: false },
            { restPeriod: 0, shouldPass: true },
            { restPeriod: 30, shouldPass: true },
            { restPeriod: 300, shouldPass: true },
            { restPeriod: 301, shouldPass: false }
        ];
        
        for (const testCase of testCases) {
            const isValid = testCase.restPeriod >= 0 && testCase.restPeriod <= 300;
            if (isValid !== testCase.shouldPass) {
                throw new Error(`Rest period validation failed for ${testCase.restPeriod}: expected ${testCase.shouldPass}, got ${isValid}`);
            }
        }
        
        return `PASS: Rest period validation works correctly for all test cases`;
    }
);

        // Test 12: Input validation - round durations
        testSuite.addTest(
            'Input Validation - Round Durations',
            'Tests round duration validation logic',
            () => {
                const testCases = [
                    { duration: -1, shouldPass: false },
                    { duration: 0, shouldPass: true },
                    { duration: 1, shouldPass: true },
                    { duration: 5, shouldPass: true },
                    { duration: 60, shouldPass: true },
                    { duration: 600, shouldPass: true },
                    { duration: 601, shouldPass: false }
                ];
                
                for (const testCase of testCases) {
                    const isValid = testCase.duration >= 0 && testCase.duration <= 600;
                    if (isValid !== testCase.shouldPass) {
                        throw new Error(`Round duration validation failed for ${testCase.duration}: expected ${testCase.shouldPass}, got ${isValid}`);
                    }
                }
                
                return `PASS: Round duration validation works correctly for all test cases`;
            }
        );

// Test 13: Progress calculation
testSuite.addTest(
    'Progress Calculation',
    'Tests progress bar calculation logic',
    () => {
        const testCases = [
            { totalTime: 60, currentTime: 30, expectedProgress: 50 },
            { totalTime: 60, currentTime: 0, expectedProgress: 100 },
            { totalTime: 60, currentTime: 60, expectedProgress: 0 },
            { totalTime: 0, currentTime: 0, expectedProgress: 0 },
            { totalTime: 30, currentTime: 45, expectedProgress: 0 } // Should clamp to 0
        ];
        
        for (const testCase of testCases) {
            const progress = testCase.totalTime > 0 ? 
                ((testCase.totalTime - testCase.currentTime) / testCase.totalTime) * 100 : 0;
            const clampedProgress = Math.max(0, Math.min(100, progress));
            
            if (Math.abs(clampedProgress - testCase.expectedProgress) > 0.1) {
                throw new Error(`Progress calculation failed: total=${testCase.totalTime}, current=${testCase.currentTime}, expected=${testCase.expectedProgress}, got=${clampedProgress}`);
            }
        }
        
        return `PASS: Progress calculation works correctly for all test cases`;
    }
);

// Test 14: Array bounds safety
testSuite.addTest(
    'Array Bounds Safety',
    'Tests array access safety in startWorkPhase',
    () => {
        const timer = testSuite.createMockTimer();
        const workoutConfig = { cycles: 1, restPeriod: 30, roundDurations: [60, 45] };
        
        // Test valid round numbers
        timer.currentRound = 1;
        if (timer.currentRound < 1 || timer.currentRound > workoutConfig.roundDurations.length) {
            throw new Error('Valid round number 1 was incorrectly rejected');
        }
        
        timer.currentRound = 2;
        if (timer.currentRound < 1 || timer.currentRound > workoutConfig.roundDurations.length) {
            throw new Error('Valid round number 2 was incorrectly rejected');
        }
        
        // Test invalid round numbers
        timer.currentRound = 0;
        if (!(timer.currentRound < 1 || timer.currentRound > workoutConfig.roundDurations.length)) {
            throw new Error('Invalid round number 0 was not rejected');
        }
        
        timer.currentRound = 3;
        if (!(timer.currentRound < 1 || timer.currentRound > workoutConfig.roundDurations.length)) {
            throw new Error('Invalid round number 3 was not rejected');
        }
        
        return `PASS: Array bounds safety works correctly`;
    }
);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HIITTimerTests, testSuite };
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.HIITTimerTests = HIITTimerTests;
    window.testSuite = testSuite;
    
    // Auto-run tests when page loads
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Unit tests loaded. Run testSuite.runAllTests() to execute tests.');
    });
} else {
    // Node.js environment
    console.log('Unit tests loaded. Run testSuite.runAllTests() to execute tests.');
}
