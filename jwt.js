const jwt = require('jsonwebtoken');

const payload = {
    issu: 1,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 ساعت اعتبار
};

const secret = 'emqxsecret';

const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

console.log(token);
