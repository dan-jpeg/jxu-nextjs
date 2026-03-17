const bcrypt = require('bcryptjs');

const password = 'bella424';
const hash = '$2b$10$6IHgUTl/.i.rcAgee8ByGehdqo8bBbSi5XB8tq0VlQcV4BZd4vIUq';

console.log('Testing password:', password);
console.log('Against hash:', hash);
console.log('Match:', bcrypt.compareSync(password, hash));