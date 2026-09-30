const { ErrorCode } = require('../utils/response');

/**
 * 轻量参数校验中间件（无第三方依赖）
 *
 * 用法：
 *   router.post('/', validate({
 *     body:  { name: { required: true, type: 'string', max: 100 } },
 *     query: { page: { type: 'integer', min: 1, default: 1 } },
 *     params:{ id: { required: true, type: 'integer', min: 1 } }
 *   }), handler)
 *
 * 规则字段：
 *   required  必填
 *   type      string | integer | number | boolean | array
 *   min/max   数值区间（number/integer）或长度区间（string）
 *   enum      枚举白名单
 *   pattern   正则
 *   default   缺省值
 *   trim      是否去除首尾空格（string，默认 true）
 *   message   自定义错误提示
 */

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function coerce(value, rule) {
  switch (rule.type) {
    case 'integer': {
      const num = Number(value);
      if (!Number.isFinite(num)) return { error: '必须为整数' };
      return { value: Math.trunc(num) };
    }
    case 'number': {
      const num = Number(value);
      if (!Number.isFinite(num)) return { error: '必须为数字' };
      return { value: num };
    }
    case 'boolean': {
      if (value === true || value === 'true' || value === '1' || value === 1) return { value: true };
      if (value === false || value === 'false' || value === '0' || value === 0) return { value: false };
      return { error: '必须为布尔值' };
    }
    case 'array':
      return Array.isArray(value) ? { value } : { error: '必须为数组' };
    case 'string':
      if (typeof value !== 'string') return { error: '必须为字符串' };
      return { value: rule.trim === false ? value : value.trim() };
    default:
      return { value };
  }
}

function checkRule(field, rawValue, rule) {
  const { value, error } = coerce(rawValue, rule);
  if (error) return { error: rule.message || `${field} ${error}` };

  if (rule.enum && !rule.enum.includes(value)) {
    return { error: rule.message || `${field} 取值不合法` };
  }
  if (rule.pattern && !rule.pattern.test(String(value))) {
    return { error: rule.message || `${field} 格式不正确` };
  }
  if (typeof value === 'string' && rule.type === 'string') {
    if (rule.min != null && value.length < rule.min) return { error: rule.message || `${field} 长度不能小于 ${rule.min}` };
    if (rule.max != null && value.length > rule.max) return { error: rule.message || `${field} 长度不能大于 ${rule.max}` };
  }
  if (typeof value === 'number') {
    if (rule.min != null && value < rule.min) return { error: rule.message || `${field} 不能小于 ${rule.min}` };
    if (rule.max != null && value > rule.max) return { error: rule.message || `${field} 不能大于 ${rule.max}` };
  }
  return { value };
}

/**
 * 校验单个数据源，返回 { errors, values }
 * values 仅包含出现（或被 default 填充）的字段，用于回写
 */
function validateSource(source, rules) {
  const errors = [];
  const values = {};
  const input = isPlainObject(source) ? source : {};

  for (const [field, rule] of Object.entries(rules)) {
    const raw = input[field];
    const isEmpty = raw === undefined || raw === null || raw === '';

    if (isEmpty) {
      if (rule.default !== undefined) {
        values[field] = rule.default;
      } else if (rule.required) {
        errors.push(rule.message || `${field} 不能为空`);
      }
      continue;
    }

    const result = checkRule(field, raw, rule);
    if (result.error) errors.push(result.error);
    else values[field] = result.value;
  }

  return { errors, values };
}

function validate(schema = {}) {
  return (req, res, next) => {
    const errors = [];

    if (schema.params) {
      const { errors: errs, values } = validateSource(req.params, schema.params);
      errors.push(...errs);
      Object.assign(req.params, values);
    }

    if (schema.query) {
      const { errors: errs, values } = validateSource(req.query, schema.query);
      errors.push(...errs);
      // Express 4 的 req.query 为原型 getter（每次访问重新解析），
      // 因此以自有属性覆盖，确保回写的强类型值对后续处理生效
      Object.defineProperty(req, 'query', {
        value: { ...req.query, ...values },
        writable: true,
        configurable: true,
        enumerable: true
      });
    }

    if (schema.body) {
      const { errors: errs, values } = validateSource(req.body, schema.body);
      errors.push(...errs);
      if (isPlainObject(req.body)) {
        Object.assign(req.body, values);
      } else {
        req.body = values;
      }
    }

    if (errors.length) {
      return res.status(400).json({
        code: ErrorCode.PARAM_VALIDATION,
        data: null,
        message: errors.join('；')
      });
    }

    return next();
  };
}

module.exports = { validate, validateSource, checkRule };