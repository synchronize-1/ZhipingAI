// backend-api/src/routes/service.routes.js
const express = require('express');
const router = express.Router();
const Service = require('../models/Service.model');
const Room = require('../models/Room.model');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { success, fail, ErrorCode } = require('../utils/response');

const idParam = {
  id: { required: true, type: 'integer', min: 1 }
};

// ========== 空闲教室查询 ==========
router.get('/rooms/available', verifyToken, validate({
  query: {
    building: { type: 'string', max: 50 },
    date: { type: 'string', max: 20 },
    timeSlot: { type: 'integer', min: 1 }
  }
}), async (req, res) => {
  try {
    const { building, date, timeSlot } = req.query;
    const rooms = await Room.getAvailableRooms(building, date, timeSlot != null ? timeSlot : null);
    return success(res, rooms);
  } catch (error) {
    console.error('获取空闲教室错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.get('/rooms/buildings', verifyToken, async (req, res) => {
  try {
    const buildings = await Room.getBuildings();
    return success(res, buildings);
  } catch (error) {
    console.error('获取教学楼列表错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/rooms/reserve', verifyToken, validate({
  body: {
    roomId: { required: true, type: 'integer', min: 1 },
    date: { required: true, type: 'string', min: 1, max: 20 },
    timeSlot: { required: true, type: 'integer', min: 1 },
    purpose: { type: 'string', max: 1000 }
  }
}), async (req, res) => {
  try {
    const { roomId, date, timeSlot, purpose } = req.body;
    const reservationId = await Room.reserve(roomId, req.user.id, date, timeSlot, purpose);
    return success(res, { reservationId }, '预约成功');
  } catch (error) {
    console.error('预约教室错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// ========== 图书借阅 ==========
router.get('/books', verifyToken, validate({
  query: {
    page: { type: 'integer', min: 1, max: 200, default: 1 },
    limit: { type: 'integer', min: 1, max: 200, default: 10 },
    keyword: { type: 'string', max: 100 },
    category: { type: 'string', max: 50 }
  }
}), async (req, res) => {
  try {
    const { page, limit, keyword, category } = req.query;
    const result = await Service.getBooks(page, limit, keyword, category);
    return success(res, result);
  } catch (error) {
    console.error('获取图书列表错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/books/:id/borrow', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const borrowingId = await Service.borrowBook(req.user.id, req.params.id);
    return success(res, { borrowingId }, '借阅成功');
  } catch (error) {
    console.error('借阅图书错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/books/borrowings/:id/return', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    await Service.returnBook(req.params.id);
    return success(res, null, '还书成功');
  } catch (error) {
    console.error('还书错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

// ========== 食堂服务 ==========
router.get('/canteens', verifyToken, async (req, res) => {
  try {
    const canteens = await Service.getCanteens();
    return success(res, canteens);
  } catch (error) {
    console.error('获取食堂列表错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.get('/canteens/crowd', verifyToken, async (req, res) => {
  try {
    const crowdLevels = await Service.getAllCanteenCrowdLevels();
    return success(res, crowdLevels);
  } catch (error) {
    console.error('获取食堂人流错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.get('/canteens/:id/crowd', verifyToken, validate({ params: idParam }), async (req, res) => {
  try {
    const crowdLevel = await Service.getCanteenCrowdLevel(req.params.id);
    return success(res, crowdLevel);
  } catch (error) {
    console.error('获取食堂人流错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.get('/canteens/:id/menu', verifyToken, validate({
  params: idParam,
  query: { category: { type: 'string', max: 50 } }
}), async (req, res) => {
  try {
    const { category } = req.query;
    const menuItems = await Service.getMenuItems(req.params.id, category);
    return success(res, menuItems);
  } catch (error) {
    console.error('获取菜单错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

router.post('/orders', verifyToken, validate({
  body: {
    canteenId: { required: true, type: 'integer', min: 1 },
    totalPrice: { required: true, type: 'number', min: 0 },
    pickupTime: { type: 'string', max: 50 }
  }
}), async (req, res) => {
  try {
    const { canteenId, items, totalPrice, pickupTime } = req.body;
    const orderId = await Service.createOrder(req.user.id, canteenId, items, totalPrice, pickupTime);
    return success(res, { orderId }, '下单成功');
  } catch (error) {
    console.error('下单错误:', error);
    return fail(res, '服务器错误', ErrorCode.SERVER_ERROR);
  }
});

module.exports = router;