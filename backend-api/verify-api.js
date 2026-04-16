const https = require('https');

// 完全按照你提供的配置
const API_KEY = 'sk-5lzLEdS2GXHR6tL19B04ulpCkPTpnZdT7WneIs2bSF82BrAI';
const API_URL = 'https://openrouter.fans/v1/chat/completions';

console.log('========================================');
console.log('验证API配置');
console.log('========================================');
console.log('URL:', API_URL);
console.log('Key:', API_KEY);
console.log('========================================\n');

const requestData = JSON.stringify({
  model: 'deepseek-chat',
  messages: [
    { role: 'user', content: '你好' }
  ],
  max_tokens: 200,
  temperature: 0.7,
  stream: false
});

const url = new URL(API_URL);
const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData)
  }
};

console.log('发送请求...');
console.log('Hostname:', options.hostname);
console.log('Path:', options.path);
console.log('请求体:', requestData);
console.log('\n等待响应...\n');

const req = https.request(options, (res) => {
  let data = '';
  
  console.log('响应状态码:', res.statusCode);
  console.log('响应头:', JSON.stringify(res.headers, null, 2));
  console.log('\n响应内容:');
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(data);
    console.log('\n========================================');
    
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('✅ 成功！');
      console.log('AI回复:', result.choices[0].message.content);
    } else {
      console.log('❌ 失败！状态码:', res.statusCode);
    }
    console.log('========================================');
  });
});

req.on('error', (error) => {
  console.error('❌ 请求错误:', error.message);
});

req.write(requestData);
req.end();
