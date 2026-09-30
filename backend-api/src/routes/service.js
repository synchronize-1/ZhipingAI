// backend-api/src/routes/service.js
const express = require('express');
const router = express.Router();
const Service = require('../models/Service.model');
const Room = require('../models/Room.model');
const { verifyToken, checkRole } = require('../middleware/auth');

// ========== 空闲教室查询 ==========
router.get('/rooms/available', verifyToken, async (req, res) => {
  try {
    const { building, date, timeSlot } = req.query;
    const rooms = await Room.getAvailableRooms(building, date, timeSlot ? parseInt(timeSlot) : null);
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('获取空闲教室错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/rooms/buildings', verifyToken, async (req, res) => {
  try {
    const buildings = await Room.getBuildings();
    res.json({ success: true, data: buildings });
  } catch (error) {
    console.error('获取教学楼列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/rooms/reserve', verifyToken, async (req, res) => {
  try {
    const { roomId, date, timeSlot, purpose } = req.body;
    const reservationId = await Room.reserve(roomId, req.user.id, date, timeSlot, purpose);
    res.status(201).json({ success: true, message: '预约成功', data: { reservationId } });
  } catch (error) {
    console.error('预约教室错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 图书借阅 ==========
router.get('/books', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword, category } = req.query;
    const result = await Service.getBooks(parseInt(page), parseInt(limit), keyword, category);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取图书列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/books/:id/borrow', verifyToken, async (req, res) => {
  try {
    const borrowingId = await Service.borrowBook(req.user.id, req.params.id);
    res.status(201).json({ success: true, message: '借阅成功', data: { borrowingId } });
  } catch (error) {
    console.error('借阅图书错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/books/borrowings/:id/return', verifyToken, async (req, res) => {
  try {
    await Service.returnBook(req.params.id);
    res.json({ success: true, message: '还书成功' });
  } catch (error) {
    console.error('还书错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 食堂服务 ==========
router.get('/canteens', verifyToken, async (req, res) => {
  try {
    const canteens = await Service.getCanteens();
    res.json({ success: true, data: canteens });
  } catch (error) {
    console.error('获取食堂列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/canteens/crowd', verifyToken, async (req, res) => {
  try {
    const crowdLevels = await Service.getAllCanteenCrowdLevels();
    res.json({ success: true, data: crowdLevels });
  } catch (error) {
    console.error('获取食堂人流错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/canteens/:id/crowd', verifyToken, async (req, res) => {
  try {
    const crowdLevel = await Service.getCanteenCrowdLevel(req.params.id);
    res.json({ success: true, data: crowdLevel });
  } catch (error) {
    console.error('获取食堂人流错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/canteens/:id/menu', verifyToken, async (req, res) => {
  try {
    const { category } = req.query;
    const menuItems = await Service.getMenuItems(req.params.id, category);
    res.json({ success: true, data: menuItems });
  } catch (error) {
    console.error('获取菜单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/orders', verifyToken, async (req, res) => {
  try {
    const { canteenId, items, totalPrice, pickupTime } = req.body;
    const orderId = await Service.createOrder(req.user.id, canteenId, items, totalPrice, pickupTime);
    res.status(201).json({ success: true, message: '下单成功', data: { orderId } });
  } catch (error) {
    console.error('下单错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
