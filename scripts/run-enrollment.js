#!/usr/bin/env node

require('dotenv').config()

const { enrollAllStudentsInAllPlatforms } = require('./enroll-existing-users')

console.log('Enroll all students in all platforms')
console.log('====================================')

enrollAllStudentsInAllPlatforms()
  .then(() => {
    console.log('Enrollment process completed successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Enrollment process failed:')
    console.error(error)
    process.exit(1)
  })
