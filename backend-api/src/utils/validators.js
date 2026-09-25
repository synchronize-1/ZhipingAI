// 简单的参数校验工具
function validateRequired(fields, data) {
  const errors = [];
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} 不能为空`);
    }
  }
  return errors.length > 0 ? errors.join('；') : null;
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^1[3-9]\d{9}$/;
  return re.test(phone);
}

module.exports = { validateRequired, validateEmail, validatePhone };
