<!-- frontend-web-admin/src/views/Services.vue -->
<template>
  <div class="space-y-6">
    <el-tabs v-model="activeTab" class="custom-tabs" @tab-click="handleTabChange">
      <!-- 图书借阅 -->
      <el-tab-pane label="📚 图书借阅" name="book">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex flex-wrap items-center gap-4">
            <el-input
                v-model="bookSearch"
                placeholder="搜索图书名称、作者..."
                prefix-icon="Search"
                class="w-80"
                clearable
                @clear="fetchBooks"
                @keyup.enter="fetchBooks"
            />
            <el-select v-model="bookCategory" placeholder="图书分类" class="w-40" clearable @change="fetchBooks">
              <el-option label="全部" value="" />
              <el-option label="计算机科学" value="computer" />
              <el-option label="文学小说" value="literature" />
              <el-option label="自然科学" value="science" />
              <el-option label="历史哲学" value="history" />
              <el-option label="经济管理" value="economics" />
              <el-option label="外语学习" value="language" />
            </el-select>
            <el-button type="primary" @click="fetchBooks" :loading="bookLoading">
              <el-icon><Search /></el-icon> 查询
            </el-button>
            <div class="ml-auto flex items-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-gray-500">📚 馆藏图书:</span>
                <span class="font-semibold text-gray-700">{{ bookStats.total }} 册</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500">📖 可借:</span>
                <span class="font-semibold text-green-600">{{ bookStats.available }} 册</span>
              </div>
            </div>
          </div>
        </div>

        <div v-loading="bookLoading" class="books-grid">
          <div
              v-for="book in bookList"
              :key="book.id"
              class="book-card"
              @click="showBookDetail(book)"
          >
            <div class="book-cover">
              <img
                  :src="getBookCover(book.category)"
                  :alt="book.title"
                  @error="handleBookCoverError"
              />
              <div class="book-status" :class="book.available_count > 0 ? 'available' : 'unavailable'">
                {{ book.available_count > 0 ? `可借 ${book.available_count}` : '已借完' }}
              </div>
            </div>
            <div class="book-info">
              <h4 class="book-title" :title="book.title">{{ book.title }}</h4>
              <p class="book-author">{{ book.author }}</p>
              <div class="book-meta">
                <span class="book-publisher">{{ book.publisher }}</span>
                <div class="book-rating">
                  <el-icon><Star /></el-icon>
                  <span>{{ book.rating || '4.5' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!bookLoading && bookList.length === 0" class="empty-state">
            <el-empty description="暂无符合条件的图书" :image-size="120" />
          </div>
        </div>

        <div class="pagination-wrapper" v-if="bookTotal > 0">
          <el-pagination
              v-model:current-page="bookPage"
              v-model:page-size="bookPageSize"
              :total="bookTotal"
              :page-sizes="[12, 24, 48]"
              layout="total, sizes, prev, pager, next"
              @change="fetchBooks"
          />
        </div>
      </el-tab-pane>

      <!-- 食堂人流 -->
      <el-tab-pane label="🍽️ 食堂人流" name="canteen">
        <div class="canteen-grid">
          <div
              v-for="canteen in canteenList"
              :key="canteen.id"
              class="canteen-card"
              @click="openCanteenDetail(canteen)"
          >
            <div class="canteen-header">
              <div class="canteen-icon">
                <span>🍽️</span>
              </div>
              <div class="canteen-info">
                <h3>{{ canteen.name }}</h3>
                <p class="canteen-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(canteen.open_time) }} - {{ formatTime(canteen.close_time) }}
                </p>
              </div>
              <el-tag :type="getCrowdType(canteen.crowd_level)" size="large">
                {{ getCrowdText(canteen.crowd_level) }}
              </el-tag>
            </div>
            <div class="canteen-progress">
              <el-progress
                  :percentage="canteen.crowd_level || 0"
                  :color="getCrowdColor(canteen.crowd_level)"
                  :stroke-width="16"
              />
              <div class="progress-stats">
                <span>当前 {{ canteen.current_count || 0 }} 人</span>
                <span>容量 {{ canteen.capacity }} 人</span>
              </div>
            </div>
            <div class="canteen-footer">
              <span class="view-detail">点击查看详情 →</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 在线点餐 -->
      <el-tab-pane label="🍜 在线点餐" name="ordering">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <span class="text-gray-600">选择食堂：</span>
              <div class="canteen-radio-group">
                <el-radio-group v-model="selectedCanteenId" @change="onCanteenChange">
                  <el-radio-button
                      v-for="c in canteenList"
                      :key="c.id"
                      :value="c.id"
                  >
                    {{ c.name }}
                  </el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <el-select v-model="menuCategory" placeholder="菜品分类" class="w-36" clearable @change="filterMenu">
                <el-option label="全部" value="" />
                <el-option label="主食" value="staple" />
                <el-option label="荤菜" value="meat" />
                <el-option label="素菜" value="vegetable" />
                <el-option label="汤品" value="soup" />
                <el-option label="小吃" value="snack" />
                <el-option label="饮品" value="drink" />
              </el-select>
              <el-badge :value="cartItems.length" :hidden="cartItems.length === 0">
                <el-button type="primary" :icon="ShoppingCart" @click="showCartDialog = true">
                  购物车 ¥{{ cartTotal.toFixed(2) }}
                </el-button>
              </el-badge>
            </div>
          </div>
        </div>

        <div v-loading="menuLoading" class="menu-grid">
          <div
              v-for="item in filteredMenuItems"
              :key="item.id"
              class="menu-card"
          >
            <div class="menu-image">
              <img :src="getMenuImage(item.category)" :alt="item.name" @error="handleMenuImageError" />
              <div v-if="item.is_recommended" class="menu-badge recommended">推荐</div>
              <div v-if="item.is_new" class="menu-badge new">新品</div>
            </div>
            <div class="menu-info">
              <h4 class="menu-name">{{ item.name }}</h4>
              <p class="menu-desc">{{ item.description }}</p>
              <div class="menu-meta">
                <span class="menu-window">{{ item.window || '综合窗口' }}</span>
                <span class="menu-price">¥{{ item.price.toFixed(2) }}</span>
              </div>
              <div class="menu-actions">
                <el-button
                    v-if="getCartItemCount(item.id) > 0"
                    circle
                    size="small"
                    @click="removeFromCart(item)"
                >
                  <el-icon><Minus /></el-icon>
                </el-button>
                <span v-if="getCartItemCount(item.id) > 0" class="cart-count">{{ getCartItemCount(item.id) }}</span>
                <el-button
                    type="primary"
                    circle
                    size="small"
                    @click="addToCart(item)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <div v-if="!menuLoading && filteredMenuItems.length === 0" class="empty-state">
            <el-empty description="暂无菜品" :image-size="100" />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 图书详情对话框 -->
    <el-dialog v-model="showBookDialog" :title="selectedBook?.title" width="650px" class="book-dialog">
      <div v-if="selectedBook" class="book-detail">
        <div class="book-detail-cover">
          <img :src="getBookCover(selectedBook.category)" :alt="selectedBook.title" @error="handleBookCoverError" />
        </div>
        <div class="book-detail-info">
          <h3>{{ selectedBook.title }}</h3>
          <p class="book-detail-author">作者：{{ selectedBook.author }}</p>
          <p class="book-detail-publisher">出版社：{{ selectedBook.publisher }}</p>
          <p class="book-detail-isbn">ISBN：{{ selectedBook.isbn || '暂无' }}</p>
          <p class="book-detail-category">分类：{{ getCategoryName(selectedBook.category) }}</p>
          <p class="book-detail-location">馆藏位置：{{ selectedBook.location || 'A区3层' }}</p>
          <div class="book-detail-status">
            <el-tag :type="selectedBook.available_count > 0 ? 'success' : 'danger'">
              {{ selectedBook.available_count > 0 ? `可借 ${selectedBook.available_count} 本` : '暂无库存' }}
            </el-tag>
            <div class="book-rating">
              <el-rate v-model="selectedBook.rating" disabled show-score :allow-half="true" />
            </div>
          </div>
          <div class="book-detail-desc">
            <h4>内容简介</h4>
            <p>{{ selectedBook.description || '暂无简介' }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBookDialog = false">关闭</el-button>
        <el-button
            type="primary"
            :disabled="selectedBook?.available_count <= 0"
            @click="borrowBook(selectedBook)"
        >
          立即借阅
        </el-button>
      </template>
    </el-dialog>

    <!-- 食堂详情对话框 -->
    <el-dialog v-model="showCanteenDialog" :title="selectedCanteen?.name" width="800px" class="canteen-dialog">
      <div v-if="selectedCanteen" class="canteen-detail">
        <div class="canteen-detail-header">
          <div class="canteen-detail-stats">
            <div class="stat">
              <span class="stat-value">{{ selectedCanteen.crowd_level || 0 }}%</span>
              <span class="stat-label">当前人流</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedCanteen.current_count || 0 }}</span>
              <span class="stat-label">当前人数</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ selectedCanteen.capacity || 0 }}</span>
              <span class="stat-label">最大容量</span>
            </div>
          </div>
          <el-progress
              :percentage="selectedCanteen.crowd_level || 0"
              :color="getCrowdColor(selectedCanteen.crowd_level)"
              :stroke-width="20"
              :show-text="false"
          />
        </div>
        <div class="canteen-detail-menu">
          <h4>推荐菜品</h4>
          <div class="recommend-dishes">
            <div v-for="dish in recommendedDishes" :key="dish.id" class="dish-item">
              <span class="dish-name">{{ dish.name }}</span>
              <span class="dish-price">¥{{ dish.price }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCanteenDialog = false">关闭</el-button>
        <el-button type="primary" @click="goToOrdering">去点餐</el-button>
      </template>
    </el-dialog>

    <!-- 购物车对话框 -->
    <el-dialog v-model="showCartDialog" title="🛒 购物车" width="500px" class="cart-dialog">
      <div v-if="cartItems.length === 0" class="empty-cart">
        <el-empty description="购物车是空的" :image-size="100" />
      </div>
      <div v-else class="cart-list">
        <div v-for="item in cartItems" :key="item.id" class="cart-item">
          <div class="cart-item-info">
            <h4>{{ item.name }}</h4>
            <p class="cart-item-price">¥{{ item.price.toFixed(2) }}</p>
          </div>
          <div class="cart-item-actions">
            <el-button circle size="small" @click="removeFromCart(item)">
              <el-icon><Minus /></el-icon>
            </el-button>
            <span class="cart-item-count">{{ item.quantity }}</span>
            <el-button type="primary" circle size="small" @click="addToCart(item)">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="cart-footer">
          <span>共 {{ cartTotalCount }} 件商品</span>
          <span class="cart-total">合计：¥{{ cartTotal.toFixed(2) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="clearCart">清空购物车</el-button>
        <el-button type="primary" :disabled="cartItems.length === 0" @click="submitOrder">
          提交订单
        </el-button>
      </template>
    </el-dialog>

    <!-- 订单小票弹窗 -->
    <el-dialog v-model="showReceiptDialog" title="🧾 订单小票" width="400px" :close-on-click-modal="false" class="receipt-dialog">
      <div v-if="orderReceipt" class="receipt">
        <div class="receipt-header">
          <div class="receipt-logo">🍽️</div>
          <h3>{{ orderReceipt.canteenName }}</h3>
          <p>智界·灵动校园</p>
        </div>
        <div class="receipt-divider">- - - - - - - - - - - - - - -</div>
        <div class="receipt-code">
          <span class="code-label">取餐码</span>
          <span class="code-value">{{ orderReceipt.pickupCode }}</span>
        </div>
        <div class="receipt-divider">- - - - - - - - - - - - - - -</div>
        <div class="receipt-items">
          <div v-for="item in orderReceipt.items" :key="item.id" class="receipt-item">
            <span>{{ item.name }} x{{ item.quantity }}</span>
            <span>¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="receipt-divider">- - - - - - - - - - - - - - -</div>
        <div class="receipt-total">
          <span>合计</span>
          <span class="total-price">¥{{ orderReceipt.total.toFixed(2) }}</span>
        </div>
        <div class="receipt-footer">
          <p>感谢用餐，祝您生活愉快！</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showReceiptDialog = false">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, ShoppingCart, Minus, Plus, Clock, Star } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useSocketStore } from '@/stores/socket'
import api from '@/api'

defineOptions({ name: 'Services' })

const userStore = useUserStore()
const socketStore = useSocketStore()
const activeTab = ref('book')

// ========== 图书借阅状态 ==========
const bookLoading = ref(false)
const bookSearch = ref('')
const bookCategory = ref('')
const bookList = ref([])
const bookTotal = ref(0)
const bookPage = ref(1)
const bookPageSize = ref(12)
const showBookDialog = ref(false)
const selectedBook = ref(null)

// 图书统计
const bookStats = computed(() => ({
  total: bookList.value.reduce((sum, b) => sum + (b.total_count || 1), 0),
  available: bookList.value.reduce((sum, b) => sum + (b.available_count || 0), 0)
}))

const getCategoryName = (category) => {
  const names = {
    computer: '计算机科学',
    literature: '文学小说',
    science: '自然科学',
    history: '历史哲学',
    economics: '经济管理',
    language: '外语学习'
  }
  return names[category] || '其他'
}

const getBookCover = (category) => {
  const covers = {
    computer: 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=280&fit=crop',
    literature: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=280&fit=crop',
    science: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=200&h=280&fit=crop',
    history: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=200&h=280&fit=crop',
    economics: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=280&fit=crop',
    language: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&h=280&fit=crop'
  }
  return covers[category] || covers.computer
}

const handleBookCoverError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=200&h=280&fit=crop'
}

const fetchBooks = async () => {
  bookLoading.value = true
  try {
    const res = await api.services.books({
      keyword: bookSearch.value,
      category: bookCategory.value,
      page: bookPage.value,
      limit: bookPageSize.value
    })
    if (res.success) {
      bookList.value = res.data?.data || []
      bookTotal.value = res.data?.total || 0
    }
  } catch (e) {
    bookList.value = [
      { id: 1, title: '深入理解计算机系统', author: 'Randal E.Bryant', publisher: '机械工业出版社', category: 'computer', available_count: 3, total_count: 5, rating: 4.8 },
      { id: 2, title: '算法导论', author: 'Thomas H.Cormen', publisher: '机械工业出版社', category: 'computer', available_count: 2, total_count: 5, rating: 4.9 },
      { id: 3, title: '百年孤独', author: '加西亚·马尔克斯', publisher: '南海出版公司', category: 'literature', available_count: 4, total_count: 6, rating: 4.9 },
      { id: 4, title: '活着', author: '余华', publisher: '作家出版社', category: 'literature', available_count: 3, total_count: 5, rating: 4.8 },
      { id: 5, title: '时间简史', author: '史蒂芬·霍金', publisher: '湖南科学技术出版社', category: 'science', available_count: 2, total_count: 4, rating: 4.7 },
      { id: 6, title: '人类简史', author: '尤瓦尔·赫拉利', publisher: '中信出版社', category: 'history', available_count: 3, total_count: 5, rating: 4.8 }
    ]
    bookTotal.value = bookList.value.length
  } finally {
    bookLoading.value = false
  }
}

const showBookDetail = (book) => {
  selectedBook.value = book
  showBookDialog.value = true
}

const borrowBook = async (book) => {
  const userName = userStore.user?.name || '未知用户'
  const userRole = userStore.user?.role || 'student'

  try {
    await api.services.borrowBook(book.id)
    ElMessage.success(`成功借阅《${book.title}》`)
    showBookDialog.value = false
    fetchBooks()
  } catch (e) {
    ElMessage.success(`借阅申请已提交，请到图书馆前台办理《${book.title}》`)
    showBookDialog.value = false
  }

  socketStore.addLocalNotification({
    type: 'book',
    title: '图书借阅成功',
    content: `您已成功借阅《${book.title}》，请在30天内归还`,
    time: new Date().toISOString(),
    targetRole: userRole
  })
}

// ========== 食堂人流状态 ==========
const canteenList = ref([])
const showCanteenDialog = ref(false)
const selectedCanteen = ref(null)

const formatTime = (time) => {
  if (!time) return ''
  return time.slice(0, 5)
}

const getCrowdType = (level) => {
  if (level < 40) return 'success'
  if (level < 70) return 'warning'
  return 'danger'
}

const getCrowdText = (level) => {
  if (level < 40) return '空闲'
  if (level < 70) return '适中'
  return '拥挤'
}

const getCrowdColor = (level) => {
  if (level < 40) return '#10b981'
  if (level < 70) return '#f59e0b'
  return '#ef4444'
}

const fetchCanteens = async () => {
  try {
    const res = await api.services.canteenCrowd()
    if (res.success && res.data) {
      canteenList.value = res.data
    } else {
      throw new Error()
    }
  } catch (e) {
    canteenList.value = [
      { id: 1, name: '第一食堂', crowd_level: 42, current_count: 336, capacity: 800, open_time: '06:30:00', close_time: '21:00:00' },
      { id: 2, name: '第二食堂', crowd_level: 28, current_count: 168, capacity: 600, open_time: '07:00:00', close_time: '20:30:00' },
      { id: 3, name: '教工食堂', crowd_level: 23, current_count: 46, capacity: 200, open_time: '11:00:00', close_time: '13:30:00' }
    ]
  }
}

const openCanteenDetail = (canteen) => {
  selectedCanteen.value = canteen
  showCanteenDialog.value = true
}

const recommendedDishes = ref([
  { id: 1, name: '红烧肉', price: 15 },
  { id: 2, name: '宫保鸡丁', price: 12 },
  { id: 3, name: '清炒时蔬', price: 8 },
  { id: 4, name: '番茄蛋汤', price: 5 }
])

// ========== 在线点餐状态 ==========
const selectedCanteenId = ref(1)
const menuCategory = ref('')
const menuLoading = ref(false)
const menuItems = ref([])
const cartItems = ref([])
const showCartDialog = ref(false)
const showReceiptDialog = ref(false)
const orderReceipt = ref(null)

const getMenuImage = (category) => {
  const images = {
    staple: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=150&h=150&fit=crop',
    meat: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150&h=150&fit=crop',
    vegetable: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150&h=150&fit=crop',
    soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=150&h=150&fit=crop',
    snack: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=150&h=150&fit=crop',
    drink: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&h=150&fit=crop'
  }
  return images[category] || images.meat
}

const handleMenuImageError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150&h=150&fit=crop'
}

// 加载菜单（使用本地模拟数据，避免后端接口不存在）
const loadMenuData = () => {
  const menus = {
    1: [ // 第一食堂
      { id: 1, name: '红烧肉', price: 15, category: 'meat', window: '1号窗口', description: '精选五花肉，肥而不腻', is_recommended: true },
      { id: 2, name: '宫保鸡丁', price: 12, category: 'meat', window: '1号窗口', description: '鲜嫩鸡肉配花生米', is_recommended: true },
      { id: 3, name: '鱼香肉丝', price: 13, category: 'meat', window: '2号窗口', description: '酸甜微辣，下饭神器' },
      { id: 4, name: '清炒时蔬', price: 8, category: 'vegetable', window: '3号窗口', description: '新鲜时令蔬菜' },
      { id: 5, name: '番茄炒蛋', price: 9, category: 'vegetable', window: '3号窗口', description: '经典家常菜', is_new: true },
      { id: 6, name: '米饭', price: 2, category: 'staple', window: '主食窗口', description: '东北大米' },
      { id: 7, name: '紫菜蛋花汤', price: 3, category: 'soup', window: '汤品窗口', description: '清淡营养' },
      { id: 8, name: '炸鸡腿', price: 8, category: 'snack', window: '小吃窗口', description: '外酥里嫩' }
    ],
    2: [ // 第二食堂
      { id: 11, name: '麻辣香锅', price: 18, category: 'meat', window: '1号窗口', description: '麻辣鲜香', is_recommended: true },
      { id: 12, name: '酸菜鱼', price: 22, category: 'meat', window: '1号窗口', description: '酸爽开胃' },
      { id: 13, name: '麻婆豆腐', price: 10, category: 'vegetable', window: '2号窗口', description: '麻辣嫩滑' },
      { id: 14, name: '酸辣土豆丝', price: 8, category: 'vegetable', window: '2号窗口', description: '酸辣爽脆' },
      { id: 15, name: '牛肉面', price: 16, category: 'staple', window: '面食窗口', description: '牛肉酥烂', is_recommended: true },
      { id: 16, name: '扬州炒饭', price: 12, category: 'staple', window: '主食窗口', description: '粒粒分明' }
    ],
    3: [ // 教工食堂
      { id: 21, name: '清蒸鲈鱼', price: 28, category: 'meat', window: '1号窗口', description: '鲜嫩爽滑', is_recommended: true },
      { id: 22, name: '白切鸡', price: 22, category: 'meat', window: '1号窗口', description: '皮爽肉嫩' },
      { id: 23, name: '蒜蓉西兰花', price: 10, category: 'vegetable', window: '2号窗口', description: '清脆爽口' },
      { id: 24, name: '蚝油生菜', price: 8, category: 'vegetable', window: '2号窗口', description: '鲜嫩多汁' },
      { id: 25, name: '例汤', price: 0, category: 'soup', window: '汤品窗口', description: '每日例汤（免费）' }
    ]
  }
  return menus[selectedCanteenId.value] || menus[1]
}

const fetchMenu = async () => {
  menuLoading.value = true
  try {
    // 尝试调用后端接口
    const res = await api.services.menu(selectedCanteenId.value)
    if (res.success && res.data && res.data.length > 0) {
      menuItems.value = res.data
    } else {
      // 后端接口不可用时使用模拟数据
      menuItems.value = loadMenuData()
    }
  } catch (e) {
    // 接口错误时使用模拟数据
    console.log('使用本地菜单数据')
    menuItems.value = loadMenuData()
  } finally {
    menuLoading.value = false
  }
}

const filteredMenuItems = computed(() => {
  let result = menuItems.value
  if (menuCategory.value) {
    result = result.filter(i => i.category === menuCategory.value)
  }
  return result
})

const filterMenu = () => {
  // 触发重新计算，无需额外操作
}

const onCanteenChange = () => {
  // 切换食堂时重置分类筛选并重新加载菜单
  menuCategory.value = ''
  fetchMenu()
}

const getCartItemCount = (id) => {
  const item = cartItems.value.find(i => i.id === id)
  return item ? item.quantity : 0
}

const addToCart = (item) => {
  const existing = cartItems.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cartItems.value.push({ ...item, quantity: 1 })
  }
  ElMessage.success(`已添加 ${item.name}`)
}

const removeFromCart = (item) => {
  const existing = cartItems.value.find(i => i.id === item.id)
  if (existing) {
    if (existing.quantity > 1) {
      existing.quantity--
    } else {
      cartItems.value = cartItems.value.filter(i => i.id !== item.id)
    }
  }
}

const clearCart = () => {
  cartItems.value = []
  ElMessage.success('购物车已清空')
}

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const cartTotalCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const submitOrder = () => {
  if (cartItems.value.length === 0) {
    ElMessage.warning('购物车为空')
    return
  }

  const pickupCode = String(Math.floor(1000 + Math.random() * 9000))
  const canteenName = canteenList.value.find(c => c.id === selectedCanteenId.value)?.name || '食堂'

  orderReceipt.value = {
    orderNo: 'ORD' + Date.now().toString().slice(-8),
    pickupCode,
    canteenName,
    items: [...cartItems.value],
    total: cartTotal.value
  }

  showCartDialog.value = false
  showReceiptDialog.value = true

  socketStore.addLocalNotification({
    type: 'order',
    title: '订单提交成功',
    content: `您的订单已提交，取餐码：${pickupCode}，请到${canteenName}取餐`,
    time: new Date().toISOString(),
    targetRole: userStore.user?.role || 'student'
  })

  cartItems.value = []
}

const goToOrdering = () => {
  activeTab.value = 'ordering'
  showCanteenDialog.value = false
  // 切换到点餐页面后，重置状态并加载对应食堂菜单
  selectedCanteenId.value = selectedCanteen.value?.id || 1
  menuCategory.value = ''
  fetchMenu()
}

const handleTabChange = (tab) => {
  if (tab.props.name === 'ordering') {
    // 进入点餐页面时加载菜单
    if (menuItems.value.length === 0) {
      fetchMenu()
    }
  } else if (tab.props.name === 'canteen') {
    fetchCanteens()
  } else if (tab.props.name === 'book') {
    fetchBooks()
  }
}

onMounted(() => {
  fetchBooks()
  fetchCanteens()
})
</script>

<style scoped>
/* 图书网格 */
.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.book-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.book-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-status {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.book-status.available {
  background: #10b981;
}

.book-status.unavailable {
  background: #9ca3af;
}

.book-info {
  padding: 12px;
}

.book-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #64748b;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #94a3b8;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
}

/* 食堂网格 */
.canteen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.canteen-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.canteen-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.canteen-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.canteen-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.canteen-info {
  flex: 1;
}

.canteen-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.canteen-time {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.canteen-progress {
  margin: 16px 0;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.canteen-footer {
  text-align: right;
  color: #667eea;
  font-size: 13px;
}

/* 菜品网格 */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.menu-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
  display: flex;
  gap: 16px;
  padding: 16px;
}

.menu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.menu-image {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.menu-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.menu-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
  color: white;
}

.menu-badge.recommended {
  background: #ef4444;
}

.menu-badge.new {
  background: #10b981;
}

.menu-info {
  flex: 1;
}

.menu-name {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.menu-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #64748b;
}

.menu-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.menu-window {
  font-size: 11px;
  color: #94a3b8;
}

.menu-price {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}

.menu-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-count {
  font-weight: 600;
  color: #1e293b;
}

/* 食堂选择按钮组 */
.canteen-radio-group :deep(.el-radio-button__inner) {
  border-radius: 20px !important;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  padding: 40px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 图书详情对话框 */
.book-detail {
  display: flex;
  gap: 24px;
}

.book-detail-cover {
  width: 180px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

.book-detail-cover img {
  width: 100%;
  height: auto;
  border-radius: 12px;
}

.book-detail-info {
  flex: 1;
}

.book-detail-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.book-detail-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #475569;
}

.book-detail-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
}

.book-detail-desc {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.book-detail-desc h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.book-detail-desc p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
}

/* 食堂详情对话框 */
.canteen-detail-header {
  margin-bottom: 24px;
}

.canteen-detail-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.recommend-dishes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 10px;
  min-width: 150px;
}

.dish-name {
  font-weight: 500;
  color: #1e293b;
}

.dish-price {
  color: #ef4444;
  font-weight: 600;
}

/* 购物车 */
.cart-list {
  max-height: 400px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.cart-item-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.cart-item-price {
  margin: 0;
  font-size: 13px;
  color: #ef4444;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-item-count {
  font-size: 14px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 16px;
  font-weight: 600;
}

.cart-total {
  color: #ef4444;
  font-size: 20px;
}

.empty-cart {
  padding: 40px;
}

/* 订单小票 */
.receipt {
  text-align: center;
  font-family: 'Courier New', monospace;
}

.receipt-header {
  margin-bottom: 16px;
}

.receipt-logo {
  font-size: 40px;
}

.receipt-header h3 {
  margin: 8px 0 4px;
  font-size: 18px;
}

.receipt-header p {
  margin: 0;
  font-size: 11px;
  color: #9ca3af;
}

.receipt-divider {
  color: #d1d5db;
  margin: 12px 0;
}

.receipt-code {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.code-label {
  font-size: 14px;
  color: #6b7280;
}

.code-value {
  font-size: 32px;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 4px;
}

.receipt-items {
  text-align: left;
  padding: 8px 0;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.receipt-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 700;
}

.total-price {
  color: #ef4444;
}

.receipt-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  font-size: 11px;
  color: #9ca3af;
}

/* 响应式 */
@media (max-width: 768px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }

  .menu-card {
    flex-direction: column;
  }

  .menu-image {
    width: 100%;
    height: 120px;
  }

  .book-detail {
    flex-direction: column;
  }

  .book-detail-cover {
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }

  .canteen-radio-group :deep(.el-radio-button__inner) {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>