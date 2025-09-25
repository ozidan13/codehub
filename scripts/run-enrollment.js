#!/usr/bin/env node

/**
 * Script Runner for JavaScript Tasks Enrollment
 * 
 * This script runs the enrollment process for existing users
 * Usage: node scripts/run-enrollment.js
 */

require('dotenv').config()
const { enrollExistingUsersInJavaScriptTasks } = require('./enroll-existing-users')

console.log('🚀 JavaScript Tasks Auto-Enrollment Script')
console.log('==========================================')
console.log('')

enrollExistingUsersInJavaScriptTasks()
  .then(() => {
    console.log('')
    console.log('🎉 Enrollment process completed successfully!')
    console.log('All existing users have been enrolled in the JavaScript Tasks platform.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('💥 Enrollment process failed:')
    console.error(error)
    console.error('')
    console.error('Please check the error above and try again.')
    process.exit(1)
  })