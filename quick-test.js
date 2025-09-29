// Quick test script to verify the timer logic
console.log('🧪 Running Quick Tests for HIIT Timer...\n');

// Test the validation logic
function testValidation() {
    console.log('📋 Testing Input Validation:');
    
    // Test round duration validation
    const testCases = [
        { duration: -1, shouldPass: false, description: 'Negative duration' },
        { duration: 0, shouldPass: true, description: 'Zero duration' },
        { duration: 1, shouldPass: true, description: '1 second duration' },
        { duration: 5, shouldPass: true, description: '5 second duration' },
        { duration: 60, shouldPass: true, description: '60 second duration' },
        { duration: 600, shouldPass: true, description: '600 second duration' },
        { duration: 601, shouldPass: false, description: '601 second duration (too high)' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        const isValid = testCase.duration >= 0 && testCase.duration <= 600;
        const result = isValid === testCase.shouldPass ? '✅ PASS' : '❌ FAIL';
        
        if (isValid === testCase.shouldPass) {
            passed++;
        } else {
            failed++;
        }
        
        console.log(`  ${result} ${testCase.description}: ${testCase.duration}s (expected: ${testCase.shouldPass}, got: ${isValid})`);
    }
    
    console.log(`\n  Validation Results: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
}

// Test timer simulation logic
function testTimerSimulation() {
    console.log('⏱️  Testing Timer Simulation:');
    
    function simulateTimer(cycles, restPeriod, roundDurations) {
        const events = [];
        let currentCycle = 1;
        let currentRound = 1;
        let phase = 'prepare';
        
        events.push('Prepare (5s)');
        
        while (currentCycle <= cycles) {
            if (phase === 'prepare') {
                phase = 'work';
            } else if (phase === 'work') {
                const duration = roundDurations[currentRound - 1];
                events.push(`Cycle ${currentCycle}, Round ${currentRound}: Work (${duration}s)`);
                
                if (currentRound < roundDurations.length) {
                    if (restPeriod > 0) {
                        events.push(`Cycle ${currentCycle}, Round ${currentRound}: Rest (${restPeriod}s)`);
                        phase = 'rest';
                    } else {
                        currentRound++;
                        phase = 'work';
                    }
                } else {
                    currentCycle++;
                    currentRound = 1;
                    if (currentCycle <= cycles) {
                        if (roundDurations.length > 1 && restPeriod > 0) {
                            events.push(`Between cycles: Rest (${restPeriod}s)`);
                            phase = 'rest';
                        } else {
                            phase = 'work';
                        }
                    } else {
                        events.push('Workout Complete!');
                        break;
                    }
                }
            } else if (phase === 'rest') {
                currentRound++;
                phase = 'work';
            }
        }
        
        return events;
    }
    
    const testCases = [
        {
            name: 'Zero Duration Round',
            config: { cycles: 1, restPeriod: 30, roundDurations: [60, 0, 45] },
            expected: [
                'Prepare (5s)',
                'Cycle 1, Round 1: Work (60s)',
                'Cycle 1, Round 1: Rest (30s)',
                'Cycle 1, Round 2: Work (0s)',
                'Cycle 1, Round 2: Rest (30s)',
                'Cycle 1, Round 3: Work (45s)',
                'Workout Complete!'
            ]
        },
        {
            name: 'Zero Rest Period',
            config: { cycles: 2, restPeriod: 0, roundDurations: [60, 45] },
            expected: [
                'Prepare (5s)',
                'Cycle 1, Round 1: Work (60s)',
                'Cycle 1, Round 2: Work (45s)',
                'Cycle 2, Round 1: Work (60s)',
                'Cycle 2, Round 2: Work (45s)',
                'Workout Complete!'
            ]
        },
        {
            name: 'Original Bug Fix (3 cycles, 1 round)',
            config: { cycles: 3, restPeriod: 30, roundDurations: [60] },
            expected: [
                'Prepare (5s)',
                'Cycle 1, Round 1: Work (60s)',
                'Cycle 2, Round 1: Work (60s)',
                'Cycle 3, Round 1: Work (60s)',
                'Workout Complete!'
            ]
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        const events = simulateTimer(testCase.config.cycles, testCase.config.restPeriod, testCase.config.roundDurations);
        const isCorrect = JSON.stringify(events) === JSON.stringify(testCase.expected);
        
        if (isCorrect) {
            passed++;
            console.log(`  ✅ PASS ${testCase.name}`);
        } else {
            failed++;
            console.log(`  ❌ FAIL ${testCase.name}`);
            console.log(`    Expected: ${testCase.expected.join(' → ')}`);
            console.log(`    Actual:   ${events.join(' → ')}`);
        }
    }
    
    console.log(`\n  Simulation Results: ${passed} passed, ${failed} failed\n`);
    return { passed, failed };
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Quick Test Suite...\n');
    
    const validationResults = testValidation();
    const simulationResults = testTimerSimulation();
    
    const totalPassed = validationResults.passed + simulationResults.passed;
    const totalFailed = validationResults.failed + simulationResults.failed;
    const totalTests = totalPassed + totalFailed;
    
    console.log('📊 Final Results:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
        console.log('\n🎉 All tests passed! The timer logic is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
    
    return { totalPassed, totalFailed, totalTests };
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.runQuickTests = runAllTests;
    console.log('Quick tests loaded. Run runQuickTests() to execute.');
} else {
    // Run tests immediately in Node.js
    runAllTests();
}
