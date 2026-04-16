<template>
  <view class="canteen-page">
    <!-- 顶部选项卡 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: activeTab === 'crowd' }" @tap="activeTab = 'crowd'">人流情况</view>
      <view class="tab-item" :class="{ active: activeTab === 'menu' }" @tap="activeTab = 'menu'">在线点餐</view>
      <view class="tab-item" :class="{ active: activeTab === 'orders' }" @tap="activeTab = 'orders'">我的订单</view>
    </view>

    <!-- 人流情况 -->
    <view v-if="activeTab === 'crowd'" class="crowd-section">
      <view v-for="canteen in canteens" :key="canteen.id" class="canteen-card">
        <view class="canteen-header">
          <text class="canteen-name">{{ canteen.name }}</text>
          <view class="crowd-tag" :class="getCrowdClass(canteen.crowd_level)">
            {{ getCrowdText(canteen.crowd_level) }}
          </view>
        </view>
        
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: (canteen.crowd_level || 0) + '%', background: getCrowdColor(canteen.crowd_level) }"></view>
        </view>
        
        <view class="canteen-info">
          <text class="info-text">当前 {{ canteen.current_count || 0 }} 人 / 容量 {{ canteen.capacity }} 人</text>
          <text class="info-time">营业时间: {{ canteen.open_time }} - {{ canteen.close_time }}</text>
        </view>
        
        <view class="action-row">
          <view class="action-btn" @tap="viewMenu(canteen)">
            <text>📋 查看菜单</text>
          </view>
          <view class="action-btn primary" @tap="navigateTo(canteen)">
            <text>🗺️ 导航前往</text>
          </view>
        </view>
      </view>
      
      <view class="tip-card">
        <text class="tip-icon">💡</text>
        <text class="tip-text">建议选择人流较少的食堂用餐，避免高峰期排队</text>
      </view>
    </view>

    <!-- 在线点餐 -->
    <view v-if="activeTab === 'menu'" class="menu-section">
      <!-- 食堂选择 -->
      <scroll-view scroll-x class="canteen-tabs">
        <view v-for="canteen in canteens" :key="canteen.id" 
              class="canteen-tab" :class="{ active: selectedCanteen?.id === canteen.id }"
              @tap="selectCanteen(canteen)">
          {{ canteen.name }}
        </view>
      </scroll-view>

      <!-- 菜品分类 -->
      <view v-if="selectedCanteen" class="menu-content">
        <scroll-view scroll-y class="category-list">
          <view v-for="cat in menuCategories" :key="cat.id" 
                class="category-item" :class="{ active: selectedCategory === cat.id }"
                @tap="selectedCategory = cat.id">
            <text class="cat-icon">{{ cat.icon }}</text>
            <text class="cat-name">{{ cat.name }}</text>
          </view>
        </scroll-view>

        <scroll-view scroll-y class="dish-list">
          <view v-for="dish in filteredDishes" :key="dish.id" class="dish-card">
            <view class="dish-image">
              <text class="dish-emoji">{{ dish.emoji }}</text>
            </view>
            <view class="dish-info">
              <text class="dish-name">{{ dish.name }}</text>
              <text class="dish-desc">{{ dish.description }}</text>
              <view class="dish-bottom">
                <text class="dish-price">¥{{ dish.price }}</text>
                <view class="quantity-control">
                  <view v-if="getCartQuantity(dish.id) > 0" class="qty-btn minus" @tap="removeFromCart(dish)">-</view>
                  <text v-if="getCartQuantity(dish.id) > 0" class="qty-num">{{ getCartQuantity(dish.id) }}</text>
                  <view class="qty-btn plus" @tap="addToCart(dish)">+</view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 购物车 -->
      <view v-if="cartItems.length > 0" class="cart-bar" @tap="showCartDetail = true">
        <view class="cart-icon">
          <text>🛒</text>
          <view class="cart-badge">{{ totalQuantity }}</view>
        </view>
        <view class="cart-info">
          <text class="cart-total">¥{{ totalPrice.toFixed(2) }}</text>
          <text class="cart-desc">已选{{ totalQuantity }}件</text>
        </view>
        <view class="cart-btn" @tap.stop="checkout">去结算</view>
      </view>
    </view>

    <!-- 我的订单 -->
    <view v-if="activeTab === 'orders'" class="orders-section">
      <view v-if="orders.length === 0" class="empty-orders">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无订单</text>
        <view class="empty-btn" @tap="activeTab = 'menu'">去点餐</view>
      </view>
      
      <view v-for="order in orders" :key="order.id" class="order-card">
        <view class="order-header">
          <text class="order-no">订单号: {{ order.orderNo }}</text>
          <text class="order-status" :class="order.status">{{ getOrderStatusText(order.status) }}</text>
        </view>
        <view class="order-canteen">{{ order.canteen }}</view>
        <view class="order-items">
          <view v-for="item in order.items" :key="item.id" class="order-item">
            <text class="item-name">{{ item.name }} x{{ item.quantity }}</text>
            <text class="item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
          </view>
        </view>
        <view class="order-footer">
          <text class="order-time">{{ order.time }}</text>
          <text class="order-total">合计: ¥{{ order.total.toFixed(2) }}</text>
        </view>
        <view v-if="order.status === 'paid'" class="pickup-info">
          <view class="pickup-number">
            <text class="pickup-label">取餐号</text>
            <text class="pickup-num">{{ order.pickupNo }}</text>
          </view>
          <text class="pickup-hint">请凭取餐号到{{ order.canteen }}取餐窗口取餐</text>
        </view>
        <view class="order-actions">
          <view v-if="order.status === 'paid'" class="action-btn" @tap="viewReceipt(order)">查看小票</view>
          <view v-if="order.status === 'completed'" class="action-btn" @tap="reorder(order)">再来一单</view>
        </view>
      </view>
    </view>

    <!-- 购物车详情弹窗 -->
    <view v-if="showCartDetail" class="cart-modal" @tap="showCartDetail = false">
      <view class="cart-content" @tap.stop>
        <view class="cart-header">
          <text class="cart-title">购物车</text>
          <view class="clear-btn" @tap="clearCart">清空</view>
        </view>
        <scroll-view scroll-y class="cart-list">
          <view v-for="item in cartItems" :key="item.id" class="cart-item">
            <view class="item-left">
              <text class="item-emoji">{{ item.emoji }}</text>
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-price">¥{{ item.price }}</text>
              </view>
            </view>
            <view class="quantity-control">
              <view class="qty-btn minus" @tap="removeFromCart(item)">-</view>
              <text class="qty-num">{{ item.quantity }}</text>
              <view class="qty-btn plus" @tap="addToCart(item)">+</view>
            </view>
          </view>
        </scroll-view>
        <view class="cart-summary">
          <text class="summary-total">合计: ¥{{ totalPrice.toFixed(2) }}</text>
          <view class="checkout-btn" @tap="checkout">去结算</view>
        </view>
      </view>
    </view>

    <!-- 支付弹窗 -->
    <view v-if="showPayment" class="payment-modal" @tap="showPayment = false">
      <view class="payment-content" @tap.stop>
        <view class="payment-header">
          <text class="payment-title">确认支付</text>
          <view class="close-btn" @tap="showPayment = false">✕</view>
        </view>
        <view class="payment-info">
          <text class="payment-canteen">{{ selectedCanteen?.name }}</text>
          <text class="payment-amount">¥{{ totalPrice.toFixed(2) }}</text>
        </view>
        <view class="payment-methods">
          <view class="method-item" :class="{ active: payMethod === 'campus' }" @tap="payMethod = 'campus'">
            <text class="method-icon">🎓</text>
            <text class="method-name">校园卡支付</text>
            <text class="method-balance">余额: ¥256.80</text>
          </view>
          <view class="method-item" :class="{ active: payMethod === 'wechat' }" @tap="payMethod = 'wechat'">
            <text class="method-icon">💚</text>
            <text class="method-name">微信支付</text>
          </view>
          <view class="method-item" :class="{ active: payMethod === 'alipay' }" @tap="payMethod = 'alipay'">
            <text class="method-icon">💙</text>
            <text class="method-name">支付宝</text>
          </view>
        </view>
        <view class="pay-btn" @tap="confirmPay">确认支付 ¥{{ totalPrice.toFixed(2) }}</view>
      </view>
    </view>

    <!-- 小票弹窗 -->
    <view v-if="showReceipt" class="receipt-modal" @tap="showReceipt = false">
      <view class="receipt-content" @tap.stop>
        <view class="receipt-paper">
          <view class="receipt-header">
            <text class="receipt-logo">🍽️</text>
            <text class="receipt-title">{{ currentReceipt?.canteen }}</text>
            <text class="receipt-subtitle">电子小票</text>
          </view>
          <view class="receipt-divider">--------------------------------</view>
          <view class="receipt-info">
            <text>订单号: {{ currentReceipt?.orderNo }}</text>
            <text>时间: {{ currentReceipt?.time }}</text>
          </view>
          <view class="receipt-divider">--------------------------------</view>
          <view class="receipt-items">
            <view v-for="item in currentReceipt?.items" :key="item.id" class="receipt-item">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-qty">x{{ item.quantity }}</text>
              <text class="item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</text>
            </view>
          </view>
          <view class="receipt-divider">--------------------------------</view>
          <view class="receipt-total">
            <text>合计</text>
            <text class="total-amount">¥{{ currentReceipt?.total.toFixed(2) }}</text>
          </view>
          <view class="receipt-divider">================================</view>
          <view class="receipt-pickup">
            <text class="pickup-title">取餐号</text>
            <text class="pickup-number">{{ currentReceipt?.pickupNo }}</text>
          </view>
          <view class="receipt-footer">
            <text>请凭此号到取餐窗口取餐</text>
            <text>谢谢惠顾，欢迎下次光临！</text>
          </view>
        </view>
        <view class="receipt-actions">
          <view class="action-btn" @tap="showReceipt = false">关闭</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '@/utils/api.js'

export default {
  data() {
    return {
      activeTab: 'crowd',
      canteens: [],
      selectedCanteen: null,
      selectedCategory: 'hot',
      cartItems: [],
      orders: [],
      showCartDetail: false,
      showPayment: false,
      showReceipt: false,
      currentReceipt: null,
      payMethod: 'campus',
      menuCategories: [
        { id: 'hot', name: '热销', icon: '🔥' },
        { id: 'rice', name: '米饭', icon: '🍚' },
        { id: 'noodle', name: '面食', icon: '🍜' },
        { id: 'snack', name: '小吃', icon: '🥟' },
        { id: 'drink', name: '饮品', icon: '🥤' },
        { id: 'dessert', name: '甜点', icon: '🍰' }
      ],
      allDishes: {
        1: [ // 第一食堂
          { id: 101, name: '红烧肉', description: '肥瘦相间，入口即化', price: 15, category: 'hot', emoji: '🥩' },
          { id: 102, name: '宫保鸡丁', description: '经典川菜，香辣可口', price: 14, category: 'hot', emoji: '🍗' },
          { id: 103, name: '番茄炒蛋', description: '酸甜开胃，营养丰富', price: 10, category: 'hot', emoji: '🍳' },
          { id: 104, name: '鱼香肉丝', description: '酸甜微辣，下饭神器', price: 13, category: 'hot', emoji: '🥢' },
          { id: 105, name: '麻婆豆腐', description: '麻辣鲜香，嫩滑入味', price: 11, category: 'hot', emoji: '🥣' },
          { id: 106, name: '蛋炒饭', description: '粒粒分明，鸡蛋香浓', price: 10, category: 'rice', emoji: '🍚' },
          { id: 107, name: '卤肉饭', description: '台式风味，肉香四溢', price: 14, category: 'rice', emoji: '🍛' },
          { id: 108, name: '咖喱鸡饭', description: '浓郁咖喱，鸡肉嫩滑', price: 15, category: 'rice', emoji: '🍛' },
          { id: 109, name: '牛肉面', description: '大块牛肉，汤鲜面劲', price: 16, category: 'noodle', emoji: '🍜' },
          { id: 110, name: '炸酱面', description: '老北京风味，酱香浓郁', price: 12, category: 'noodle', emoji: '🍝' },
          { id: 111, name: '饺子', description: '手工现包，皮薄馅大', price: 12, category: 'snack', emoji: '🥟' },
          { id: 112, name: '煎饼果子', description: '外酥里嫩，早餐首选', price: 8, category: 'snack', emoji: '🥞' },
          { id: 113, name: '豆浆', description: '现磨豆浆，香浓顺滑', price: 3, category: 'drink', emoji: '🥛' },
          { id: 114, name: '酸梅汤', description: '清凉解暑，酸甜可口', price: 5, category: 'drink', emoji: '🧃' }
        ],
        2: [ // 第二食堂
          { id: 201, name: '麻辣香锅', description: '自选食材，麻辣鲜香', price: 22, category: 'hot', emoji: '🍲' },
          { id: 202, name: '黄焖鸡', description: '鸡肉软烂，酱香入味', price: 18, category: 'hot', emoji: '🍗' },
          { id: 203, name: '酸菜鱼', description: '鱼肉鲜嫩，酸辣开胃', price: 25, category: 'hot', emoji: '🐟' },
          { id: 204, name: '西兰花炒肉', description: '清爽营养，健康之选', price: 12, category: 'hot', emoji: '🥦' },
          { id: 205, name: '烤鸭饭', description: '脆皮烤鸭，配饭更香', price: 18, category: 'rice', emoji: '🦆' },
          { id: 206, name: '煲仔饭', description: '锅巴香脆，腊味浓郁', price: 20, category: 'rice', emoji: '🍚' },
          { id: 207, name: '酸辣粉', description: '酸辣过瘾，Q弹爽滑', price: 10, category: 'noodle', emoji: '🍜' },
          { id: 208, name: '重庆小面', description: '麻辣鲜香，地道重庆味', price: 11, category: 'noodle', emoji: '🍝' },
          { id: 209, name: '生煎包', description: '底部焦脆，汤汁丰富', price: 10, category: 'snack', emoji: '🥟' },
          { id: 210, name: '烧麦', description: '皮薄馅足，鲜香可口', price: 8, category: 'snack', emoji: '🥡' },
          { id: 211, name: '珍珠奶茶', description: '香浓奶茶，Q弹珍珠', price: 8, category: 'drink', emoji: '🧋' },
          { id: 212, name: '柠檬茶', description: '清新柠檬，清热解渴', price: 6, category: 'drink', emoji: '🍋' },
          { id: 213, name: '蛋挞', description: '酥脆外皮，嫩滑内心', price: 5, category: 'dessert', emoji: '🥧' },
          { id: 214, name: '双皮奶', description: '顺滑香甜，奶香浓郁', price: 8, category: 'dessert', emoji: '🍮' }
        ],
        3: [ // 教工食堂
          { id: 301, name: '清蒸鲈鱼', description: '鲜嫩多汁，原汁原味', price: 28, category: 'hot', emoji: '🐟' },
          { id: 302, name: '白切鸡', description: '皮爽肉滑，原味鲜美', price: 22, category: 'hot', emoji: '🍗' },
          { id: 303, name: '蒜蓉西兰花', description: '清淡爽口，营养健康', price: 12, category: 'hot', emoji: '🥦' },
          { id: 304, name: '红烧排骨', description: '色泽红亮，肉质酥烂', price: 20, category: 'hot', emoji: '🍖' },
          { id: 305, name: '扬州炒饭', description: '什锦配料，粒粒分明', price: 14, category: 'rice', emoji: '🍚' },
          { id: 306, name: '海鲜粥', description: '海鲜丰富，粥底绵密', price: 18, category: 'rice', emoji: '🥣' },
          { id: 307, name: '阳春面', description: '清汤素面，简约美味', price: 10, category: 'noodle', emoji: '🍜' },
          { id: 308, name: '云吞面', description: '鲜虾云吞，汤鲜面滑', price: 15, category: 'noodle', emoji: '🥟' },
          { id: 309, name: '春卷', description: '金黄酥脆，馅料丰富', price: 8, category: 'snack', emoji: '🥠' },
          { id: 310, name: '虾饺', description: '透明虾饺，鲜嫩弹牙', price: 12, category: 'snack', emoji: '🥟' },
          { id: 311, name: '铁观音', description: '清香四溢，回甘持久', price: 10, category: 'drink', emoji: '🍵' },
          { id: 312, name: '银耳羹', description: '润肺养颜，甜而不腻', price: 8, category: 'dessert', emoji: '🍨' }
        ]
      }
    }
  },
  computed: {
    filteredDishes() {
      if (!this.selectedCanteen) return []
      const dishes = this.allDishes[this.selectedCanteen.id] || []
      if (this.selectedCategory === 'hot') {
        return dishes.filter(d => d.category === 'hot')
      }
      return dishes.filter(d => d.category === this.selectedCategory)
    },
    totalQuantity() {
      return this.cartItems.reduce((sum, item) => sum + item.quantity, 0)
    },
    totalPrice() {
      return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }
  },
  onShow() {
    this.fetchCanteens()
    this.loadOrders()
  },
  methods: {
    async fetchCanteens() {
      try {
        const res = await api.services.canteenCrowd()
        if (res.success) this.canteens = res.data || []
      } catch (e) {
        this.canteens = [
          { id: 1, name: '第一食堂', crowd_level: 40, current_count: 320, capacity: 800, open_time: '06:30', close_time: '21:00' },
          { id: 2, name: '第二食堂', crowd_level: 30, current_count: 180, capacity: 600, open_time: '07:00', close_time: '20:30' },
          { id: 3, name: '教工食堂', crowd_level: 23, current_count: 45, capacity: 200, open_time: '11:00', close_time: '13:00' }
        ]
      }
    },
    loadOrders() {
      const saved = uni.getStorageSync('canteenOrders') || []
      this.orders = saved
    },
    saveOrders() {
      uni.setStorageSync('canteenOrders', this.orders)
    },
    getCrowdClass(level) {
      if (level < 40) return 'low'
      if (level < 70) return 'medium'
      return 'high'
    },
    getCrowdText(level) {
      if (level < 40) return '空闲'
      if (level < 70) return '适中'
      return '拥挤'
    },
    getCrowdColor(level) {
      if (level < 40) return '#5a8f5a'
      if (level < 70) return '#d4a574'
      return '#c97c5d'
    },
    viewMenu(canteen) {
      this.selectedCanteen = canteen
      this.activeTab = 'menu'
    },
    navigateTo(canteen) {
      uni.navigateTo({ url: `/pages/map/map?target=${canteen.name}` })
    },
    selectCanteen(canteen) {
      this.selectedCanteen = canteen
      this.cartItems = []
    },
    getCartQuantity(dishId) {
      const item = this.cartItems.find(i => i.id === dishId)
      return item ? item.quantity : 0
    },
    addToCart(dish) {
      const existing = this.cartItems.find(i => i.id === dish.id)
      if (existing) {
        existing.quantity++
      } else {
        this.cartItems.push({ ...dish, quantity: 1 })
      }
    },
    removeFromCart(dish) {
      const idx = this.cartItems.findIndex(i => i.id === dish.id)
      if (idx > -1) {
        if (this.cartItems[idx].quantity > 1) {
          this.cartItems[idx].quantity--
        } else {
          this.cartItems.splice(idx, 1)
        }
      }
    },
    clearCart() {
      this.cartItems = []
      this.showCartDetail = false
    },
    checkout() {
      this.showCartDetail = false
      this.showPayment = true
    },
    confirmPay() {
      const orderNo = 'ORD' + Date.now().toString().slice(-8)
      const pickupNo = 'A' + String(Math.floor(Math.random() * 900 + 100))
      const now = new Date()
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      
      const order = {
        id: Date.now(),
        orderNo,
        pickupNo,
        canteen: this.selectedCanteen.name,
        items: [...this.cartItems],
        total: this.totalPrice,
        time: timeStr,
        status: 'paid'
      }
      
      this.orders.unshift(order)
      this.saveOrders()
      this.showPayment = false
      this.cartItems = []
      
      // 添加通知
      this.addNotification({
        type: 'service',
        title: '点餐成功',
        content: `您在${order.canteen}的订单已支付成功，取餐号：${order.pickupNo}，请及时取餐！`
      })
      
      uni.showToast({ title: '支付成功', icon: 'success' })
      
      setTimeout(() => {
        this.currentReceipt = order
        this.showReceipt = true
        this.activeTab = 'orders'
      }, 1500)
    },
    addNotification(notification) {
      const notifications = uni.getStorageSync('localNotifications') || []
      notifications.unshift({
        id: Date.now(),
        ...notification,
        created_at: new Date().toISOString(),
        is_read: false
      })
      uni.setStorageSync('localNotifications', notifications)
    },
    getOrderStatusText(status) {
      const texts = { pending: '待支付', paid: '待取餐', completed: '已完成', cancelled: '已取消' }
      return texts[status] || status
    },
    viewReceipt(order) {
      this.currentReceipt = order
      this.showReceipt = true
    },
    reorder(order) {
      this.selectedCanteen = this.canteens.find(c => c.name === order.canteen)
      this.cartItems = order.items.map(item => ({ ...item }))
      this.activeTab = 'menu'
    }
  }
}
</script>

<style scoped>
.canteen-page { background: #faf8f5; min-height: 100vh; padding-bottom: 120rpx; }

.tab-bar { display: flex; background: #fff; padding: 20rpx; gap: 20rpx; position: sticky; top: 0; z-index: 10; }
.tab-item { flex: 1; text-align: center; padding: 20rpx; border-radius: 30rpx; font-size: 28rpx; color: #666; background: #f5f5f5; }
.tab-item.active { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }

.crowd-section { padding: 20rpx; }
.canteen-card { background: #fff; border-radius: 24rpx; padding: 30rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05); }
.canteen-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.canteen-name { font-size: 34rpx; font-weight: bold; color: #333; }
.crowd-tag { padding: 8rpx 20rpx; border-radius: 20rpx; font-size: 24rpx; }
.crowd-tag.low { background: #d1fae5; color: #059669; }
.crowd-tag.medium { background: #fef3c7; color: #d97706; }
.crowd-tag.high { background: #fee2e2; color: #dc2626; }
.progress-bar { height: 16rpx; background: #e5e7eb; border-radius: 8rpx; overflow: hidden; margin-bottom: 20rpx; }
.progress-fill { height: 100%; border-radius: 8rpx; transition: width 0.3s; }
.canteen-info { margin-bottom: 20rpx; }
.info-text { display: block; font-size: 28rpx; color: #666; }
.info-time { display: block; font-size: 24rpx; color: #999; margin-top: 8rpx; }
.action-row { display: flex; gap: 20rpx; }
.action-btn { flex: 1; padding: 20rpx; background: #f5f5f5; border-radius: 16rpx; text-align: center; font-size: 28rpx; color: #666; }
.action-btn.primary { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }
.tip-card { display: flex; align-items: center; background: #fffbeb; border-radius: 16rpx; padding: 20rpx; }
.tip-icon { font-size: 36rpx; margin-right: 15rpx; }
.tip-text { flex: 1; font-size: 26rpx; color: #92400e; }

.menu-section { display: flex; flex-direction: column; height: calc(100vh - 140rpx); }
.canteen-tabs { white-space: nowrap; padding: 20rpx; background: #fff; }
.canteen-tab { display: inline-block; padding: 16rpx 30rpx; margin-right: 20rpx; border-radius: 30rpx; font-size: 26rpx; color: #666; background: #f5f5f5; }
.canteen-tab.active { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }
.menu-content { flex: 1; display: flex; overflow: hidden; }
.category-list { width: 160rpx; background: #fff; border-right: 1rpx solid #f0f0f0; }
.category-item { padding: 30rpx 20rpx; text-align: center; border-left: 4rpx solid transparent; }
.category-item.active { background: #faf8f5; border-left-color: #d4a574; }
.cat-icon { display: block; font-size: 36rpx; margin-bottom: 8rpx; }
.cat-name { font-size: 24rpx; color: #666; }
.dish-list { flex: 1; padding: 20rpx; }
.dish-card { display: flex; background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 20rpx; }
.dish-image { width: 140rpx; height: 140rpx; background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); border-radius: 12rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; }
.dish-emoji { font-size: 60rpx; }
.dish-info { flex: 1; display: flex; flex-direction: column; }
.dish-name { font-size: 30rpx; font-weight: 500; color: #333; }
.dish-desc { font-size: 24rpx; color: #999; margin-top: 8rpx; flex: 1; }
.dish-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 10rpx; }
.dish-price { font-size: 32rpx; font-weight: bold; color: #c97c5d; }
.quantity-control { display: flex; align-items: center; gap: 15rpx; }
.qty-btn { width: 48rpx; height: 48rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32rpx; }
.qty-btn.minus { background: #f5f5f5; color: #666; }
.qty-btn.plus { background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; }
.qty-num { font-size: 28rpx; font-weight: 500; min-width: 40rpx; text-align: center; }

.cart-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 20rpx 30rpx; display: flex; align-items: center; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1); z-index: 100; }
.cart-icon { position: relative; margin-right: 20rpx; font-size: 48rpx; }
.cart-badge { position: absolute; top: -10rpx; right: -10rpx; background: #c97c5d; color: #fff; font-size: 20rpx; min-width: 32rpx; height: 32rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; }
.cart-info { flex: 1; }
.cart-total { display: block; font-size: 32rpx; font-weight: bold; color: #333; }
.cart-desc { display: block; font-size: 24rpx; color: #999; }
.cart-btn { padding: 20rpx 40rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 28rpx; }

.orders-section { padding: 20rpx; }
.empty-orders { text-align: center; padding: 100rpx 0; }
.empty-icon { display: block; font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { display: block; font-size: 28rpx; color: #999; margin-bottom: 30rpx; }
.empty-btn { display: inline-block; padding: 20rpx 60rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 28rpx; }
.order-card { background: #fff; border-radius: 20rpx; padding: 25rpx; margin-bottom: 20rpx; }
.order-header { display: flex; justify-content: space-between; margin-bottom: 15rpx; }
.order-no { font-size: 24rpx; color: #999; }
.order-status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 12rpx; }
.order-status.paid { background: #fef3c7; color: #d97706; }
.order-status.completed { background: #d1fae5; color: #059669; }
.order-canteen { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 15rpx; }
.order-items { border-top: 1rpx solid #f0f0f0; padding-top: 15rpx; }
.order-item { display: flex; justify-content: space-between; padding: 10rpx 0; font-size: 26rpx; }
.item-name { color: #666; }
.item-price { color: #333; }
.order-footer { display: flex; justify-content: space-between; margin-top: 15rpx; padding-top: 15rpx; border-top: 1rpx solid #f0f0f0; }
.order-time { font-size: 24rpx; color: #999; }
.order-total { font-size: 28rpx; font-weight: bold; color: #c97c5d; }
.pickup-info { margin-top: 20rpx; padding: 20rpx; background: linear-gradient(135deg, #f5e6d3 0%, #e8d4be 100%); border-radius: 16rpx; text-align: center; }
.pickup-number { margin-bottom: 10rpx; }
.pickup-label { font-size: 24rpx; color: #666; display: block; }
.pickup-num { font-size: 56rpx; font-weight: bold; color: #8b6914; }
.pickup-hint { font-size: 24rpx; color: #999; }
.order-actions { margin-top: 20rpx; display: flex; gap: 20rpx; }
.order-actions .action-btn { flex: 1; text-align: center; padding: 16rpx; background: #f5f5f5; border-radius: 30rpx; font-size: 26rpx; color: #666; }

.cart-modal, .payment-modal, .receipt-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end; }
.cart-content, .payment-content { background: #fff; border-radius: 30rpx 30rpx 0 0; padding: 30rpx; max-height: 70vh; }
.cart-header, .payment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #f0f0f0; }
.cart-title, .payment-title { font-size: 32rpx; font-weight: bold; }
.clear-btn { font-size: 26rpx; color: #999; }
.close-btn { font-size: 36rpx; color: #999; }
.cart-list { max-height: 400rpx; }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.item-left { display: flex; align-items: center; gap: 15rpx; }
.item-emoji { font-size: 40rpx; }
.item-info .item-name { display: block; font-size: 28rpx; color: #333; }
.item-info .item-price { display: block; font-size: 24rpx; color: #c97c5d; margin-top: 4rpx; }
.cart-summary { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #f0f0f0; }
.summary-total { font-size: 32rpx; font-weight: bold; color: #333; }
.checkout-btn { padding: 20rpx 60rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 28rpx; }

.payment-info { text-align: center; padding: 30rpx 0; }
.payment-canteen { display: block; font-size: 28rpx; color: #666; }
.payment-amount { display: block; font-size: 56rpx; font-weight: bold; color: #333; margin-top: 10rpx; }
.payment-methods { margin: 20rpx 0; }
.method-item { display: flex; align-items: center; padding: 25rpx; border: 2rpx solid #f0f0f0; border-radius: 16rpx; margin-bottom: 15rpx; }
.method-item.active { border-color: #d4a574; background: #faf8f5; }
.method-icon { font-size: 40rpx; margin-right: 20rpx; }
.method-name { flex: 1; font-size: 28rpx; color: #333; }
.method-balance { font-size: 24rpx; color: #999; }
.pay-btn { text-align: center; padding: 28rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 40rpx; font-size: 32rpx; font-weight: 500; }

.receipt-content { background: #fff; border-radius: 30rpx 30rpx 0 0; padding: 30rpx; }
.receipt-paper { background: #faf8f5; border-radius: 16rpx; padding: 30rpx; font-family: 'Courier New', monospace; }
.receipt-header { text-align: center; margin-bottom: 20rpx; }
.receipt-logo { display: block; font-size: 48rpx; }
.receipt-title { display: block; font-size: 32rpx; font-weight: bold; margin-top: 10rpx; }
.receipt-subtitle { display: block; font-size: 24rpx; color: #999; margin-top: 5rpx; }
.receipt-divider { text-align: center; color: #ccc; font-size: 24rpx; margin: 15rpx 0; }
.receipt-info { font-size: 24rpx; color: #666; }
.receipt-info text { display: block; margin-bottom: 8rpx; }
.receipt-items { margin: 15rpx 0; }
.receipt-item { display: flex; justify-content: space-between; font-size: 26rpx; padding: 8rpx 0; }
.receipt-item .item-name { flex: 1; }
.receipt-item .item-qty { width: 80rpx; text-align: center; }
.receipt-item .item-price { width: 120rpx; text-align: right; }
.receipt-total { display: flex; justify-content: space-between; font-size: 30rpx; font-weight: bold; padding: 15rpx 0; }
.total-amount { color: #c97c5d; }
.receipt-pickup { text-align: center; padding: 20rpx 0; }
.receipt-pickup .pickup-title { display: block; font-size: 24rpx; color: #666; }
.receipt-pickup .pickup-number { display: block; font-size: 64rpx; font-weight: bold; color: #8b6914; }
.receipt-footer { text-align: center; font-size: 22rpx; color: #999; }
.receipt-footer text { display: block; margin-top: 8rpx; }
.receipt-actions { margin-top: 20rpx; }
.receipt-actions .action-btn { text-align: center; padding: 24rpx; background: linear-gradient(135deg, #d4a574 0%, #c9956c 100%); color: #fff; border-radius: 30rpx; font-size: 28rpx; }
</style>
