<template>
  <div class="space-y-6">
    <el-tabs v-model="activeTab" class="custom-tabs">
      <!-- 报修服务 -->
      <el-tab-pane label="报修服务" name="repair">
        <!-- 管理员视图：报修记录管理 -->
        <div v-if="isAdmin" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-4">
              <h3 class="text-lg font-semibold">📋 报修记录管理</h3>
              <el-select v-model="repairStatusFilter" placeholder="状态筛选" class="w-32" clearable>
                <el-option label="全部" value="" />
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="processing" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </div>
            <div class="text-sm text-gray-500">
              共 <span class="text-blue-500 font-bold">{{ repairRecords.length }}</span> 条报修记录
            </div>
          </div>
          <el-table :data="filteredRepairRecords" stripe style="width: 100%" class="rounded-xl overflow-hidden">
            <el-table-column prop="id" label="工单号" width="100" />
            <el-table-column prop="title" label="报修标题" min-width="150" />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getRepairCategoryType(row.category)">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" min-width="120" />
            <el-table-column prop="reporter" label="报修人" width="100" />
            <el-table-column prop="reportTime" label="报修时间" width="160" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getRepairStatusType(row.status)" size="small">{{ getRepairStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="handleRepair(row)">处理</el-button>
                <el-button size="small" type="success" @click="completeRepair(row)" :disabled="row.status === 'completed'">完成</el-button>
                <el-button size="small" type="info" @click="viewRepairDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <!-- 学生视图：提交报修 -->
        <div v-else>
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <el-button type="primary" :icon="Plus" @click="showRepairDialog = true">提交报修</el-button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="repair in repairs" :key="repair.id" 
                 class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium">{{ repair.title }}</h4>
                <el-tag :type="getRepairStatusType(repair.status)" size="small">{{ getRepairStatusText(repair.status) }}</el-tag>
              </div>
              <p class="text-sm text-gray-600 mb-2">{{ repair.description }}</p>
              <p class="text-xs text-gray-500">📍 {{ repair.location }}</p>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 图书借阅 -->
      <el-tab-pane label="图书借阅" name="book">
        <!-- 管理员视图：图书借阅记录 -->
        <div v-if="isAdmin" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">📚 图书借阅记录管理</h3>
            <div class="text-sm text-gray-500">
              共 <span class="text-blue-500 font-bold">{{ bookBorrowRecords.length }}</span> 条借阅记录
            </div>
          </div>
          <el-table :data="bookBorrowRecords" stripe style="width: 100%">
            <el-table-column prop="id" label="借阅ID" width="100" />
            <el-table-column prop="studentName" label="借阅人" width="100" />
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="bookTitle" label="图书名称" min-width="180" />
            <el-table-column prop="borrowDate" label="借阅日期" width="120" />
            <el-table-column prop="dueDate" label="应还日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '已归还' ? 'success' : row.status === '逾期' ? 'danger' : 'primary'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="returnBook(row)" :disabled="row.status === '已归还'">归还</el-button>
                <el-button size="small" type="primary" @click="renewBook(row)" :disabled="row.status !== '借阅中'">续借</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 学生视图：图书搜索和借阅 -->
        <div v-else class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex flex-wrap items-center gap-4">
            <el-input v-model="bookSearch" placeholder="搜索图书名称、作者..." prefix-icon="Search" class="w-80" clearable />
            <el-select v-model="bookCategory" placeholder="图书分类" class="w-40" clearable>
              <el-option label="全部" value="" />
              <el-option label="计算机科学" value="computer" />
              <el-option label="文学小说" value="literature" />
              <el-option label="自然科学" value="science" />
              <el-option label="历史哲学" value="history" />
              <el-option label="经济管理" value="economics" />
              <el-option label="外语学习" value="language" />
            </el-select>
            <div class="ml-auto flex items-center gap-2 text-sm text-gray-500">
              <span>📚 馆藏图书: {{ bookStats.total }} 册</span>
              <span class="text-green-500">可借: {{ bookStats.available }} 册</span>
            </div>
          </div>
        </div>
        
        <!-- 图书列表 -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <div v-for="book in filteredBooks" :key="book.id" 
               class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
               @click="showBookDetail(book)">
            <div class="h-48 relative overflow-hidden">
              <img :src="book.cover" :alt="book.title" class="w-full h-full object-cover" @error="handleBookCoverError($event)" />
              <div class="absolute top-2 right-2">
                <el-tag :type="book.available_count > 0 ? 'success' : 'info'" size="small">
                  {{ book.available_count > 0 ? `可借 ${book.available_count}` : '已借完' }}
                </el-tag>
              </div>
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <span class="text-white text-xs">{{ book.category_name }}</span>
              </div>
            </div>
            <div class="p-3">
              <h4 class="font-medium text-sm line-clamp-2 mb-1" :title="book.title">{{ book.title }}</h4>
              <p class="text-xs text-gray-500 truncate">{{ book.author }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-xs text-gray-400">{{ book.publisher }}</span>
                <div class="flex items-center gap-1">
                  <el-icon class="text-yellow-500" :size="12"><Star /></el-icon>
                  <span class="text-xs">{{ book.rating || '4.5' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="filteredBooks.length === 0" class="text-center py-20">
          <el-icon :size="64" class="text-gray-300 mb-4"><Reading /></el-icon>
          <p class="text-gray-400">暂无符合条件的图书</p>
        </div>
      </el-tab-pane>

      <!-- 食堂人流 -->
      <el-tab-pane label="食堂人流" name="canteen">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="canteen in canteens" :key="canteen.id" 
               class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
               @click="openCanteenDetail(canteen)">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl">
                  🍽️
                </div>
                <div>
                  <h3 class="text-lg font-semibold">{{ canteen.name }}</h3>
                  <p class="text-xs text-gray-400">点击查看详情</p>
                </div>
              </div>
              <el-tag :type="getCrowdType(canteen.crowd_level)" size="large">{{ getCrowdText(canteen.crowd_level) }}</el-tag>
            </div>
            <el-progress :percentage="canteen.crowd_level || 0" :color="getCrowdColor(canteen.crowd_level)" :stroke-width="20" />
            <div class="flex items-center justify-between mt-3 text-sm text-gray-500">
              <span>当前 {{ canteen.current_count || 0 }} 人 / 容量 {{ canteen.capacity }} 人</span>
              <el-icon class="text-gray-400 group-hover:text-indigo-500 transition-colors"><ArrowRight /></el-icon>
            </div>
            <p class="text-xs text-gray-400 mt-1">营业时间: {{ canteen.open_time?.slice(0,5) }} - {{ canteen.close_time?.slice(0,5) }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- 在线点餐 -->
      <el-tab-pane label="在线点餐" name="ordering">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex flex-wrap items-center gap-4">
            <el-select v-model="selectedCanteenId" placeholder="选择食堂" class="w-48">
              <el-option v-for="c in canteens" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-select v-model="menuCategory" placeholder="菜品分类" class="w-36" clearable>
              <el-option label="全部" value="" />
              <el-option label="主食" value="staple" />
              <el-option label="荤菜" value="meat" />
              <el-option label="素菜" value="vegetable" />
              <el-option label="汤品" value="soup" />
              <el-option label="小吃" value="snack" />
              <el-option label="饮品" value="drink" />
            </el-select>
            <div class="ml-auto">
              <el-badge :value="cartItems.length" :hidden="cartItems.length === 0">
                <el-button type="primary" :icon="ShoppingCart" @click="showCartDialog = true">
                  购物车 ¥{{ cartTotal.toFixed(2) }}
                </el-button>
              </el-badge>
            </div>
          </div>
        </div>
        
        <!-- 菜品列表 -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div v-for="item in filteredMenuItems" :key="item.id" 
               class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
            <div class="h-40 relative overflow-hidden">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover" @error="handleMenuImageError($event)" />
              <div v-if="item.is_recommended" class="absolute top-2 left-2">
                <el-tag type="danger" size="small">推荐</el-tag>
              </div>
              <div v-if="item.is_new" class="absolute top-2 right-2">
                <el-tag type="success" size="small">新品</el-tag>
              </div>
            </div>
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium truncate" :title="item.name">{{ item.name }}</h4>
                <span class="text-xs text-gray-400">{{ item.window }}</span>
              </div>
              <p class="text-xs text-gray-500 line-clamp-2 mb-3">{{ item.description }}</p>
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-red-500">¥{{ item.price.toFixed(2) }}</span>
                <div class="flex items-center gap-2">
                  <el-button v-if="getCartItemCount(item.id) > 0" circle size="small" @click="removeFromCart(item)">
                    <el-icon><Minus /></el-icon>
                  </el-button>
                  <span v-if="getCartItemCount(item.id) > 0" class="font-medium">{{ getCartItemCount(item.id) }}</span>
                  <el-button type="primary" circle size="small" @click="addToCart(item)">
                    <el-icon><Plus /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 设备预约 -->
      <el-tab-pane label="设备预约" name="equipment">
        <!-- 管理员视图：设备预约记录 -->
        <div v-if="isAdmin" class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">🔧 设备预约记录管理</h3>
            <div class="text-sm text-gray-500">
              共 <span class="text-blue-500 font-bold">{{ equipmentReservations.length }}</span> 条预约记录
            </div>
          </div>
          <el-table :data="equipmentReservations" stripe style="width: 100%">
            <el-table-column prop="id" label="预约ID" width="100" />
            <el-table-column prop="studentName" label="预约人" width="100" />
            <el-table-column prop="studentId" label="学号" width="120" />
            <el-table-column prop="equipmentName" label="设备名称" min-width="150" />
            <el-table-column prop="category" label="设备类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reserveDate" label="预约日期" width="120" />
            <el-table-column prop="timeSlot" label="时间段" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '已归还' ? 'success' : row.status === '使用中' ? 'primary' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="approveReservation(row)" :disabled="row.status !== '待审批'">审批</el-button>
                <el-button size="small" type="danger" @click="rejectReservation(row)" :disabled="row.status !== '待审批'">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 学生视图：设备列表 -->
        <div v-else class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <el-select v-model="equipmentCategory" placeholder="设备类型" clearable class="w-36">
                <el-option label="全部" value="" />
                <el-option label="多媒体设备" value="multimedia" />
                <el-option label="计算机设备" value="computer" />
                <el-option label="影音设备" value="av" />
                <el-option label="运动器材" value="sports" />
                <el-option label="实验设备" value="lab" />
              </el-select>
              <el-input v-model="equipmentSearch" placeholder="搜索设备..." prefix-icon="Search" class="w-60" clearable />
            </div>
            <div class="text-sm text-gray-500">
              共 <span class="text-blue-600 font-bold">{{ equipments.length }}</span> 台设备，
              <span class="text-green-600 font-bold">{{ equipments.filter(e => e.status === 'available').length }}</span> 台可预约
            </div>
          </div>
        </div>
        <div v-if="!isAdmin" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="equip in filteredEquipments" :key="equip.id" 
               class="equipment-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all">
            <div class="h-40 relative" :style="{ background: equip.gradient }">
              <img v-if="equip.image" :src="equip.image" :alt="equip.name" class="w-full h-full object-cover" />
              <div class="absolute top-3 right-3">
                <el-tag :type="equip.status === 'available' ? 'success' : equip.status === 'reserved' ? 'warning' : 'info'" effect="dark">
                  {{ equip.status === 'available' ? '可预约' : equip.status === 'reserved' ? '已预约' : '维护中' }}
                </el-tag>
              </div>
            </div>
            <div class="p-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ background: equip.iconBg }">
                  <span class="text-xl">{{ equip.icon }}</span>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">{{ equip.name }}</h4>
                  <p class="text-xs text-gray-500">{{ equip.category }}</p>
                </div>
              </div>
              <div class="text-sm text-gray-600 mb-3">
                <p class="flex items-center gap-2 mb-1"><span>📍</span>{{ equip.location }}</p>
                <p class="flex items-center gap-2"><span>⏰</span>{{ equip.availableTime }}</p>
              </div>
              <el-button type="primary" class="w-full" :disabled="equip.status !== 'available'" @click="openEquipmentReserve(equip)">
                {{ equip.status === 'available' ? '立即预约' : equip.status === 'reserved' ? '已被预约' : '暂不可用' }}
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 报修对话框 -->
    <el-dialog v-model="showRepairDialog" title="提交报修" width="500px">
      <el-form :model="repairForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="repairForm.title" placeholder="请简要描述问题" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="repairForm.category" class="w-full">
            <el-option label="电器故障" value="electrical" />
            <el-option label="水管问题" value="plumbing" />
            <el-option label="家具损坏" value="furniture" />
            <el-option label="网络故障" value="network" />
            <el-option label="门窗问题" value="door" />
            <el-option label="空调维修" value="ac" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-cascader 
            v-model="repairForm.locationPath" 
            :options="locationOptions" 
            class="w-full"
            placeholder="请选择位置"
            :props="{ expandTrigger: 'hover' }"
            @change="handleLocationChange"
          />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="repairForm.location" placeholder="如：3层走廊尽头" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="repairForm.description" type="textarea" :rows="3" placeholder="请详细描述问题情况" />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload action="#" list-type="picture-card" :auto-upload="false" :limit="3">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交</el-button>
      </template>
    </el-dialog>
    
    <!-- 报修详情对话框 -->
    <el-dialog v-model="showRepairDetailDialog" title="📋 报修工单详情" width="600px">
      <div v-if="selectedRepair" class="space-y-4">
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-gray-800">{{ selectedRepair.title }}</h3>
            <el-tag :type="getRepairStatusType(selectedRepair.status)" size="large">
              {{ getRepairStatusText(selectedRepair.status) }}
            </el-tag>
          </div>
          <div class="text-sm text-gray-600">
            <p class="mb-1">工单号：<span class="font-mono font-semibold">{{ selectedRepair.id }}</span></p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <p class="text-xs text-gray-500 mb-1">报修类别</p>
            <el-tag :type="getRepairCategoryType(selectedRepair.category)" size="large">
              {{ selectedRepair.category }}
            </el-tag>
          </div>
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <p class="text-xs text-gray-500 mb-1">报修人</p>
            <p class="font-semibold text-gray-800">{{ selectedRepair.reporter }}</p>
          </div>
        </div>
        
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-xs text-gray-500 mb-2">报修位置</p>
          <p class="font-semibold text-gray-800 flex items-center gap-2">
            <span>📍</span>{{ selectedRepair.location }}
          </p>
        </div>
        
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-xs text-gray-500 mb-2">报修时间</p>
          <p class="font-semibold text-gray-800 flex items-center gap-2">
            <span>🕐</span>{{ selectedRepair.reportTime }}
          </p>
        </div>
        
        <div class="bg-white rounded-lg p-4 border border-gray-200">
          <p class="text-xs text-gray-500 mb-2">问题描述</p>
          <p class="text-gray-700 leading-relaxed">{{ selectedRepair.description }}</p>
        </div>
        
        <div v-if="selectedRepair.status === 'processing' || selectedRepair.status === 'completed'" 
             class="bg-green-50 rounded-lg p-4 border border-green-200">
          <p class="text-xs text-green-600 mb-2">处理进度</p>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span class="text-gray-700">工单已接收</span>
              <span class="text-xs text-gray-500 ml-auto">{{ selectedRepair.reportTime }}</span>
            </div>
            <div v-if="selectedRepair.status === 'processing' || selectedRepair.status === 'completed'" 
                 class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span class="text-gray-700">维修人员已派遣</span>
              <span class="text-xs text-gray-500 ml-auto">处理中</span>
            </div>
            <div v-if="selectedRepair.status === 'completed'" 
                 class="flex items-center gap-2 text-sm">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span class="text-gray-700">维修已完成</span>
              <span class="text-xs text-gray-500 ml-auto">已完成</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showRepairDetailDialog = false">关闭</el-button>
        <el-button v-if="selectedRepair?.status === 'pending'" type="primary" @click="handleRepair(selectedRepair); showRepairDetailDialog = false">
          开始处理
        </el-button>
        <el-button v-if="selectedRepair?.status === 'processing'" type="success" @click="completeRepair(selectedRepair); showRepairDetailDialog = false">
          标记完成
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 图书详情对话框 -->
    <el-dialog v-model="showBookDialog" :title="selectedBook?.title" width="700px">
      <div v-if="selectedBook" class="flex gap-6">
        <div class="w-48 flex-shrink-0">
          <img :src="selectedBook.cover" :alt="selectedBook.title" class="w-full rounded-lg shadow-md" @error="handleBookCoverError($event)" />
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold mb-2">{{ selectedBook.title }}</h2>
          <div class="space-y-2 text-sm text-gray-600">
            <p><span class="text-gray-400">作者：</span>{{ selectedBook.author }}</p>
            <p><span class="text-gray-400">出版社：</span>{{ selectedBook.publisher }}</p>
            <p><span class="text-gray-400">ISBN：</span>{{ selectedBook.isbn }}</p>
            <p><span class="text-gray-400">分类：</span>{{ selectedBook.category_name }}</p>
            <p><span class="text-gray-400">馆藏位置：</span>{{ selectedBook.location || 'A区3层书架' }}</p>
          </div>
          <div class="flex items-center gap-4 mt-4">
            <el-tag :type="selectedBook.available_count > 0 ? 'success' : 'danger'">
              {{ selectedBook.available_count > 0 ? `可借 ${selectedBook.available_count} 本` : '暂无库存' }}
            </el-tag>
            <div class="flex items-center gap-1">
              <el-rate v-model="selectedBook.rating" disabled show-score />
            </div>
          </div>
          <el-divider />
          <div>
            <h4 class="font-medium mb-2">内容简介</h4>
            <p class="text-sm text-gray-600 leading-relaxed">{{ selectedBook.description || '暂无简介' }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBookDialog = false">关闭</el-button>
        <el-button type="primary" :disabled="selectedBook?.available_count <= 0" @click="borrowBook(selectedBook)">
          立即借阅
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 食堂详情对话框 -->
    <el-dialog v-model="showCanteenDialog" :title="selectedCanteen?.name + ' - 详情'" width="900px" top="5vh">
      <div v-if="selectedCanteen">
        <!-- 顶部信息 -->
        <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white mb-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">{{ selectedCanteen.name }}</h2>
              <p class="opacity-80">营业时间: {{ selectedCanteen.open_time?.slice(0,5) }} - {{ selectedCanteen.close_time?.slice(0,5) }}</p>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold">{{ selectedCanteen.crowd_level }}%</div>
              <div class="text-sm opacity-80">当前人流</div>
            </div>
          </div>
        </div>
        
        <!-- 实时数据 -->
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ selectedCanteen.current_count || 0 }}</div>
            <div class="text-sm text-gray-500">当前人数</div>
          </div>
          <div class="bg-green-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ selectedCanteen.capacity }}</div>
            <div class="text-sm text-gray-500">最大容量</div>
          </div>
          <div class="bg-orange-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-orange-600">{{ canteenStats.avgWaitTime }}</div>
            <div class="text-sm text-gray-500">平均等待(分钟)</div>
          </div>
          <div class="bg-purple-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-purple-600">{{ canteenStats.windowsOpen }}</div>
            <div class="text-sm text-gray-500">开放窗口</div>
          </div>
        </div>
        
        <!-- 窗口详情 -->
        <h3 class="font-bold mb-4">🍴 各窗口排队情况</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div v-for="window in canteenWindows" :key="window.id" class="bg-white rounded-xl p-4 border border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ window.name }}</span>
              <el-tag :type="window.queue < 5 ? 'success' : window.queue < 10 ? 'warning' : 'danger'" size="small">
                {{ window.queue < 5 ? '空闲' : window.queue < 10 ? '适中' : '排队' }}
              </el-tag>
            </div>
            <p class="text-sm text-gray-500">排队人数: {{ window.queue }} 人</p>
            <p class="text-xs text-gray-400">预计等待: {{ window.waitTime }} 分钟</p>
            <div class="mt-2 text-xs text-gray-500">
              <span class="text-orange-500">热门:</span> {{ window.popular }}
            </div>
          </div>
        </div>
        
        <!-- 今日推荐 -->
        <h3 class="font-bold mb-4">🌟 今日推荐</h3>
        <div class="flex gap-4 overflow-x-auto pb-4">
          <div v-for="dish in recommendedDishes" :key="dish.id" class="flex-shrink-0 w-40">
            <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
              <img :src="dish.image" :alt="dish.name" class="w-full h-24 object-cover" @error="handleMenuImageError($event)" />
              <div class="p-2">
                <h4 class="font-medium text-sm truncate">{{ dish.name }}</h4>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-red-500 font-bold">¥{{ dish.price }}</span>
                  <span class="text-xs text-gray-400">{{ dish.window }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCanteenDialog = false">关闭</el-button>
        <el-button type="primary" @click="goToOrdering(selectedCanteen)">
          <el-icon class="mr-1"><ShoppingCart /></el-icon> 去点餐
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 购物车对话框 -->
    <el-dialog v-model="showCartDialog" title="购物车" width="500px">
      <div v-if="cartItems.length === 0" class="text-center py-10">
        <el-icon :size="48" class="text-gray-300 mb-4"><ShoppingCart /></el-icon>
        <p class="text-gray-400">购物车是空的</p>
      </div>
      <div v-else>
        <div v-for="item in cartItems" :key="item.id" class="flex items-center gap-4 py-3 border-b border-gray-100">
          <img :src="item.image" :alt="item.name" class="w-16 h-16 rounded-lg object-cover" @error="handleMenuImageError($event)" />
          <div class="flex-1">
            <h4 class="font-medium">{{ item.name }}</h4>
            <p class="text-sm text-red-500">¥{{ item.price.toFixed(2) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <el-button circle size="small" @click="removeFromCart(item)">
              <el-icon><Minus /></el-icon>
            </el-button>
            <span class="font-medium w-8 text-center">{{ item.quantity }}</span>
            <el-button type="primary" circle size="small" @click="addToCart(item)">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <span class="text-gray-500">共 {{ cartItems.reduce((sum, i) => sum + i.quantity, 0) }} 件商品</span>
          <span class="text-xl font-bold text-red-500">¥{{ cartTotal.toFixed(2) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="clearCart">清空购物车</el-button>
        <el-button type="primary" :disabled="cartItems.length === 0" @click="submitOrder">
          提交订单
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 设备预约对话框 -->
    <el-dialog v-model="showEquipmentDialog" title="设备预约" width="500px">
      <div v-if="selectedEquipment" class="equipment-reserve-form">
        <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div class="w-16 h-16 rounded-xl flex items-center justify-center" :style="{ background: selectedEquipment.iconBg }">
            <span class="text-3xl">{{ selectedEquipment.icon }}</span>
          </div>
          <div>
            <h3 class="font-bold text-lg">{{ selectedEquipment.name }}</h3>
            <p class="text-sm text-gray-500">{{ selectedEquipment.category }}</p>
          </div>
        </div>
        <el-form label-width="80px">
          <el-form-item label="预约日期">
            <el-date-picker v-model="reserveForm.date" type="date" placeholder="选择日期" class="w-full" />
          </el-form-item>
          <el-form-item label="预约时段">
            <el-select v-model="reserveForm.timeSlot" placeholder="选择时段" class="w-full">
              <el-option label="08:00 - 10:00" value="08:00-10:00" />
              <el-option label="10:00 - 12:00" value="10:00-12:00" />
              <el-option label="14:00 - 16:00" value="14:00-16:00" />
              <el-option label="16:00 - 18:00" value="16:00-18:00" />
              <el-option label="19:00 - 21:00" value="19:00-21:00" />
            </el-select>
          </el-form-item>
          <el-form-item label="使用用途">
            <el-input v-model="reserveForm.purpose" type="textarea" :rows="2" placeholder="请简要说明使用用途" />
          </el-form-item>
        </el-form>
        <div class="text-sm text-gray-500 mt-4">
          <p>📍 领取地点：{{ selectedEquipment.location }}</p>
          <p>⏰ 可用时间：{{ selectedEquipment.availableTime }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEquipmentDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEquipmentReserve">确认预约</el-button>
      </template>
    </el-dialog>
    
    <!-- 订单小票弹窗 -->
    <el-dialog v-model="showReceiptDialog" title="订单小票" width="400px" :close-on-click-modal="false">
      <div v-if="orderReceipt" class="order-receipt">
        <div class="receipt-header">
          <div class="receipt-logo">🍽️</div>
          <h2>{{ orderReceipt.canteenName }}</h2>
          <p class="receipt-subtitle">智界·灵动校园</p>
        </div>
        
        <div class="receipt-divider">- - - - - - - - - - - - - - - - - -</div>
        
        <div class="pickup-code-section">
          <p class="pickup-label">取餐码</p>
          <div class="pickup-code">{{ orderReceipt.pickupCode }}</div>
          <p class="pickup-hint">请凭此码到窗口取餐</p>
        </div>
        
        <div class="receipt-divider">- - - - - - - - - - - - - - - - - -</div>
        
        <div class="receipt-info">
          <p><span>订单号：</span>{{ orderReceipt.orderNo }}</p>
          <p><span>下单时间：</span>{{ orderReceipt.createTime }}</p>
          <p><span>预计等待：</span>{{ orderReceipt.estimatedTime }}</p>
        </div>
        
        <div class="receipt-divider">- - - - - - - - - - - - - - - - - -</div>
        
        <div class="receipt-items">
          <div v-for="item in orderReceipt.items" :key="item.id" class="receipt-item">
            <span class="item-name">{{ item.name }} x{{ item.quantity }}</span>
            <span class="item-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="receipt-divider">- - - - - - - - - - - - - - - - - -</div>
        
        <div class="receipt-total">
          <span>合计 ({{ orderReceipt.totalCount }}件)</span>
          <span class="total-price">¥{{ orderReceipt.total.toFixed(2) }}</span>
        </div>
        
        <div class="receipt-footer">
          <p>感谢您的光临，祝您用餐愉快！</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showReceiptDialog = false">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Reading, Monitor, Star, ArrowRight, ShoppingCart, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useSocketStore } from '@/stores/socket'

defineOptions({ name: 'Services' })
import api from '@/api'

const userStore = useUserStore()
const socketStore = useSocketStore()
const isAdmin = computed(() => userStore.user?.role === 'admin')

// 默认图书借阅记录
const defaultBookBorrowRecords = [
  { id: 'B001', studentName: '张明轩', studentId: '2024001001', bookTitle: '深入理解计算机系统', borrowDate: '2026-01-05', dueDate: '2026-01-19', status: '借阅中' },
  { id: 'B002', studentName: '李雨晴', studentId: '2024001002', bookTitle: '算法导论', borrowDate: '2026-01-03', dueDate: '2026-01-17', status: '借阅中' },
  { id: 'B003', studentName: '王子轩', studentId: '2023001001', bookTitle: '三体', borrowDate: '2025-12-28', dueDate: '2026-01-11', status: '逾期' },
  { id: 'B004', studentName: '陈思琪', studentId: '2024001003', bookTitle: '百年孤独', borrowDate: '2026-01-08', dueDate: '2026-01-22', status: '借阅中' },
  { id: 'B005', studentName: '刘浩宇', studentId: '2024001004', bookTitle: 'Python编程从入门到实践', borrowDate: '2026-01-02', dueDate: '2026-01-16', status: '已归还' },
  { id: 'B006', studentName: '周雅婷', studentId: '2023001002', bookTitle: '人类简史', borrowDate: '2026-01-10', dueDate: '2026-01-24', status: '借阅中' }
]

// 从localStorage加载共享的借阅记录
const loadSharedBookRecords = () => {
  const saved = localStorage.getItem('sharedBookBorrowRecords')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return [...parsed, ...defaultBookBorrowRecords]
    } catch (e) {
      return defaultBookBorrowRecords
    }
  }
  return defaultBookBorrowRecords
}

// 保存借阅记录到localStorage
const saveSharedBookRecord = (record) => {
  const saved = localStorage.getItem('sharedBookBorrowRecords')
  let records = []
  if (saved) {
    try {
      records = JSON.parse(saved)
    } catch (e) {
      records = []
    }
  }
  records.unshift(record)
  localStorage.setItem('sharedBookBorrowRecords', JSON.stringify(records))
}

// 图书借阅记录数据（管理员视图）- 从localStorage加载
const bookBorrowRecords = ref(loadSharedBookRecords())

// 默认设备预约记录
const defaultEquipmentReservations = [
  { id: 'E001', studentName: '张明轩', studentId: '2024001001', equipmentName: '投影仪 Sony VPL-FHZ75', category: '多媒体', reserveDate: '2026-01-16', timeSlot: '14:00-16:00', status: '待审批' },
  { id: 'E002', studentName: '李雨晴', studentId: '2024001002', equipmentName: 'MacBook Pro 16寸', category: '计算机', reserveDate: '2026-01-15', timeSlot: '10:00-12:00', status: '使用中' },
  { id: 'E003', studentName: '王子轩', studentId: '2023001001', equipmentName: '单反相机 Canon 5D4', category: '影音设备', reserveDate: '2026-01-14', timeSlot: '08:00-18:00', status: '已归还' },
  { id: 'E004', studentName: '陈思琪', studentId: '2024001003', equipmentName: '无人机 DJI Mavic 3', category: '影音设备', reserveDate: '2026-01-17', timeSlot: '10:00-14:00', status: '待审批' },
  { id: 'E005', studentName: '刘浩宇', studentId: '2024001004', equipmentName: '羽毛球拍套装', category: '运动器材', reserveDate: '2026-01-16', timeSlot: '18:00-20:00', status: '待审批' },
  { id: 'E006', studentName: '周雅婷', studentId: '2023001002', equipmentName: '显微镜 Olympus BX53', category: '实验设备', reserveDate: '2026-01-15', timeSlot: '14:00-17:00', status: '使用中' }
]

// 从localStorage加载共享的设备预约记录
const loadSharedEquipmentRecords = () => {
  const saved = localStorage.getItem('sharedEquipmentReservations')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return [...parsed, ...defaultEquipmentReservations]
    } catch (e) {
      return defaultEquipmentReservations
    }
  }
  return defaultEquipmentReservations
}

// 保存设备预约记录到localStorage
const saveSharedEquipmentRecord = (record) => {
  const saved = localStorage.getItem('sharedEquipmentReservations')
  let records = []
  if (saved) {
    try {
      records = JSON.parse(saved)
    } catch (e) {
      records = []
    }
  }
  records.unshift(record)
  localStorage.setItem('sharedEquipmentReservations', JSON.stringify(records))
}

// 设备预约记录数据（管理员视图）- 从localStorage加载
const equipmentReservations = ref(loadSharedEquipmentRecords())

const returnBook = (row) => {
  row.status = '已归还'
  ElMessage.success(`图书「${row.bookTitle}」已归还`)
}

const renewBook = (row) => {
  const dueDate = new Date(row.dueDate)
  dueDate.setDate(dueDate.getDate() + 14)
  row.dueDate = dueDate.toISOString().split('T')[0]
  ElMessage.success(`图书「${row.bookTitle}」续借成功，新还书日期：${row.dueDate}`)
}

const approveReservation = (row) => {
  row.status = '使用中'
  ElMessage.success(`设备「${row.equipmentName}」预约已审批通过`)
}

const rejectReservation = (row) => {
  equipmentReservations.value = equipmentReservations.value.filter(r => r.id !== row.id)
  ElMessage.success(`已拒绝 ${row.studentName} 的设备预约`)
}

const activeTab = ref('repair')
const repairs = ref([])
const repairStatusFilter = ref('')

// 默认报修记录数据
const defaultRepairRecords = [
  { id: '#2024001', title: '教室空调故障', category: '电器', location: '教学楼A-301', reporter: '李明轩', reportTime: '2026-01-10 09:30', status: 'pending', description: '空调无法制热，室内温度过低', submitterId: 6 },
  { id: '#2024002', title: '宿舍热水器不工作', category: '水电', location: '3号楼201室', reporter: '张雨晴', reportTime: '2026-01-10 14:22', status: 'processing', description: '热水器无法加热，已报修2天', submitterId: 7 },
  { id: '#2024003', title: '实验室电脑蓝屏', category: '电脑', location: '计算机实验室A-302', reporter: '陈伟杰', reportTime: '2026-01-09 16:45', status: 'completed', description: '开机后频繁蓝屏，无法正常使用', submitterId: 8 },
  { id: '#2024004', title: '图书馆灯管闪烁', category: '电器', location: '图书馆3楼阅览室', reporter: '林思琪', reportTime: '2026-01-09 11:20', status: 'completed', description: '靠窗位置灯管闪烁严重，影响阅读', submitterId: 9 },
  { id: '#2024005', title: '食堂水龙头漏水', category: '水电', location: '第一食堂2楼', reporter: '黄俊豪', reportTime: '2026-01-11 08:15', status: 'pending', description: '水龙头关不紧，一直在滴水', submitterId: 10 },
  { id: '#2024006', title: '体育馆门锁损坏', category: '其他', location: '体育馆B区更衣室', reporter: '吴雪梅', reportTime: '2026-01-11 10:30', status: 'pending', description: '门锁无法正常锁闭，存在安全隐患', submitterId: 11 },
  { id: '#2024007', title: '多媒体教室投影仪模糊', category: '电器', location: '教学楼B-205', reporter: '周子轩', reportTime: '2026-01-08 15:00', status: 'processing', description: '投影画面模糊，影响教学', submitterId: 12 }
]

// 从localStorage加载共享的报修记录
const loadSharedRepairRecords = () => {
  const saved = localStorage.getItem('sharedRepairRecords')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return [...parsed, ...defaultRepairRecords]
    } catch (e) {
      return defaultRepairRecords
    }
  }
  return defaultRepairRecords
}

// 保存报修记录到localStorage
const saveSharedRepairRecord = (record) => {
  const saved = localStorage.getItem('sharedRepairRecords')
  let records = []
  if (saved) {
    try {
      records = JSON.parse(saved)
    } catch (e) {
      records = []
    }
  }
  records.unshift(record)
  localStorage.setItem('sharedRepairRecords', JSON.stringify(records))
}

// 管理员报修记录数据 - 从localStorage加载
const repairRecords = ref(loadSharedRepairRecords())

const filteredRepairRecords = computed(() => {
  if (!repairStatusFilter.value) return repairRecords.value
  return repairRecords.value.filter(r => r.status === repairStatusFilter.value)
})

const getRepairCategoryType = (category) => {
  const types = { '电器': 'warning', '水电': 'primary', '电脑': 'success', '其他': 'info' }
  return types[category] || 'info'
}

const handleRepair = (row) => {
  row.status = 'processing'
  ElMessage.success(`工单 ${row.id} 已开始处理`)
  
  // 通过WebSocket通知报修提交者
  if (row.submitterId) {
    socketStore.updateRepairStatus(row.id, 'processing', '维修人员已派遣，正在处理中', row.submitterId)
  }
}

const completeRepair = (row) => {
  row.status = 'completed'
  ElMessage.success(`工单 ${row.id} 已完成`)
  
  // 通过WebSocket通知报修提交者
  if (row.submitterId) {
    socketStore.updateRepairStatus(row.id, 'completed', '报修已处理完成，感谢您的耐心等待', row.submitterId)
  }
  
  // 添加完成通知到通知中心
  const userName = userStore.user?.name || '未知用户'
  socketStore.addLocalNotification({
    type: 'repair',
    title: '报修工单已完成',
    content: `您的报修「${row.title}」已完成处理，感谢您的耐心等待`,
    time: new Date().toISOString(),
    targetRole: 'student',
    sourceUserName: userName
  })
}

const viewRepairDetail = (row) => {
  selectedRepair.value = row
  showRepairDetailDialog.value = true
}
const books = ref([])
const bookSearch = ref('')
const bookCategory = ref('')
const canteens = ref([])
const equipments = ref([])
const showRepairDialog = ref(false)
const showRepairDetailDialog = ref(false)
const selectedRepair = ref(null)
const showBookDialog = ref(false)
const showCanteenDialog = ref(false)
const showCartDialog = ref(false)
const selectedBook = ref(null)
const selectedCanteen = ref(null)
const selectedCanteenId = ref(1)
const menuCategory = ref('')
const cartItems = ref([])
const repairForm = ref({ title: '', category: 'other', location: '', description: '', locationPath: [] })
const reserveForm = ref({ date: null, timeSlot: '', purpose: '' })

// 位置选项 - 级联选择器
const locationOptions = [
  {
    value: 'dormitory',
    label: '学生宿舍',
    children: [
      { value: '1号楼', label: '1号楼', children: [
        { value: '101', label: '101室' }, { value: '102', label: '102室' }, { value: '103', label: '103室' },
        { value: '201', label: '201室' }, { value: '202', label: '202室' }, { value: '203', label: '203室' },
        { value: '301', label: '301室' }, { value: '302', label: '302室' }, { value: '303', label: '303室' }
      ]},
      { value: '2号楼', label: '2号楼', children: [
        { value: '101', label: '101室' }, { value: '102', label: '102室' }, { value: '103', label: '103室' },
        { value: '201', label: '201室' }, { value: '202', label: '202室' }, { value: '203', label: '203室' }
      ]},
      { value: '3号楼', label: '3号楼', children: [
        { value: '101', label: '101室' }, { value: '102', label: '102室' }, { value: '201', label: '201室' }
      ]}
    ]
  },
  {
    value: 'lab',
    label: '实验室',
    children: [
      { value: '计算机实验室', label: '计算机实验室', children: [
        { value: 'A-301', label: 'A-301' }, { value: 'A-302', label: 'A-302' }, { value: 'A-303', label: 'A-303' }
      ]},
      { value: '物理实验室', label: '物理实验室', children: [
        { value: 'B-201', label: 'B-201' }, { value: 'B-202', label: 'B-202' }
      ]},
      { value: '化学实验室', label: '化学实验室', children: [
        { value: 'C-101', label: 'C-101' }, { value: 'C-102', label: 'C-102' }
      ]},
      { value: '生物实验室', label: '生物实验室', children: [
        { value: 'D-401', label: 'D-401' }
      ]}
    ]
  },
  {
    value: 'teaching',
    label: '教学楼',
    children: [
      { value: '教学楼A', label: '教学楼A', children: [
        { value: '101', label: '101教室' }, { value: '102', label: '102教室' }, { value: '201', label: '201教室' },
        { value: '202', label: '202教室' }, { value: '301', label: '301教室' }
      ]},
      { value: '教学楼B', label: '教学楼B', children: [
        { value: '101', label: '101教室' }, { value: '102', label: '102教室' }, { value: '201', label: '201教室' }
      ]},
      { value: '教学楼C', label: '教学楼C', children: [
        { value: '101', label: '101教室' }, { value: '201', label: '201教室' }, { value: '301', label: '301教室' }
      ]}
    ]
  },
  {
    value: 'library',
    label: '图书馆',
    children: [
      { value: '一楼', label: '一楼', children: [
        { value: '大厅', label: '大厅' }, { value: '自习区', label: '自习区' }
      ]},
      { value: '二楼', label: '二楼', children: [
        { value: '阅览室', label: '阅览室' }, { value: '电子阅览室', label: '电子阅览室' }
      ]},
      { value: '三楼', label: '三楼', children: [
        { value: '研讨室', label: '研讨室' }, { value: '期刊区', label: '期刊区' }
      ]}
    ]
  },
  {
    value: 'canteen',
    label: '食堂',
    children: [
      { value: '第一食堂', label: '第一食堂', children: [
        { value: '一楼', label: '一楼' }, { value: '二楼', label: '二楼' }
      ]},
      { value: '第二食堂', label: '第二食堂', children: [
        { value: '一楼', label: '一楼' }
      ]},
      { value: '教工食堂', label: '教工食堂', children: [
        { value: '一楼', label: '一楼' }
      ]}
    ]
  },
  {
    value: 'other',
    label: '其他区域',
    children: [
      { value: '体育馆', label: '体育馆' },
      { value: '行政楼', label: '行政楼' },
      { value: '校医院', label: '校医院' },
      { value: '停车场', label: '停车场' }
    ]
  }
]

// 图书数据 - 使用书本封面图片
const booksData = ref([
  { id: 1, title: '深入理解计算机系统', author: 'Randal E.Bryant', publisher: '机械工业出版社', isbn: '978-7-111-54493-7', category: 'computer', category_name: '计算机科学', cover: 'https://images.pexels.com/photos/1148399/pexels-photo-1148399.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 3, rating: 4.8, description: '本书是一本将计算机软件和硬件理论结合讲述的经典教程，内容覆盖计算机导论、体系结构和处理器设计等多门课程。' },
  { id: 2, title: '算法导论', author: 'Thomas H.Cormen', publisher: '机械工业出版社', isbn: '978-7-111-40701-0', category: 'computer', category_name: '计算机科学', cover: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 2, rating: 4.9, description: '本书全面地介绍了计算机算法。对每一个算法的分析既易于理解又十分有趣，并保持了数学严谨性。' },
  { id: 3, title: 'JavaScript高级程序设计', author: 'Nicholas C.Zakas', publisher: '人民邮电出版社', isbn: '978-7-115-54509-5', category: 'computer', category_name: '计算机科学', cover: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 5, rating: 4.7, description: '本书是JavaScript经典图书的新版，全面深入地介绍了Web开发的各个方面。' },
  { id: 4, title: '百年孤独', author: '加西亚·马尔克斯', publisher: '南海出版公司', isbn: '978-7-5442-5362-0', category: 'literature', category_name: '文学小说', cover: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 4, rating: 4.9, description: '《百年孤独》是魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。' },
  { id: 5, title: '活着', author: '余华', publisher: '作家出版社', isbn: '978-7-5063-6815-6', category: 'literature', category_name: '文学小说', cover: 'https://images.pexels.com/photos/2465877/pexels-photo-2465877.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 6, rating: 4.8, description: '地主少爷福贵嗜赌成性，终于赌光了家业一贫如洗，穷困之中福贵因母亲生病前去求医。' },
  { id: 6, title: '三体', author: '刘慈欣', publisher: '重庆出版社', isbn: '978-7-229-04238-0', category: 'literature', category_name: '文学小说', cover: 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 2, rating: 4.8, description: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划"红岸工程"取得了突破性进展。' },
  { id: 7, title: '时间简史', author: '史蒂芬·霍金', publisher: '湖南科学技术出版社', isbn: '978-7-5357-5546-2', category: 'science', category_name: '自然科学', cover: 'https://images.pexels.com/photos/5428012/pexels-photo-5428012.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 3, rating: 4.6, description: '《时间简史》讲述是探索时间和空间核心秘密的故事，是关于宇宙本性的最前沿知识。' },
  { id: 8, title: '人类简史', author: '尤瓦尔·赫拉利', publisher: '中信出版社', isbn: '978-7-5086-7078-4', category: 'history', category_name: '历史哲学', cover: 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 4, rating: 4.7, description: '十万年前，地球上至少有六种不同的人，但今日，世界舞台为什么只剩下我们自己？' },
  { id: 9, title: '经济学原理', author: '曼昆', publisher: '北京大学出版社', isbn: '978-7-301-15063-8', category: 'economics', category_name: '经济管理', cover: 'https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 5, rating: 4.5, description: '本书是世界上最流行的经济学教材，为大学一年级学生而写，主要特点是它的"学生导向"。' },
  { id: 10, title: '新概念英语', author: 'L.G.亚历山大', publisher: '外语教学与研究出版社', isbn: '978-7-5600-1348-5', category: 'language', category_name: '外语学习', cover: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 8, rating: 4.4, description: '《新概念英语》是世界闻名的英语教程，本版是该书出版30年来经作者亲自修订的唯一新版。' },
  { id: 11, title: 'Python编程从入门到实践', author: 'Eric Matthes', publisher: '人民邮电出版社', isbn: '978-7-115-42802-8', category: 'computer', category_name: '计算机科学', cover: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 4, rating: 4.6, description: '本书是一本针对所有层次的Python读者而作的Python入门书，是一本极佳的Python学习用书。' },
  { id: 12, title: '设计模式', author: 'Erich Gamma', publisher: '机械工业出版社', isbn: '978-7-111-07557-3', category: 'computer', category_name: '计算机科学', cover: 'https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg?auto=compress&cs=tinysrgb&w=300', available_count: 2, rating: 4.7, description: '本书结合设计实例从面向对象的设计中精选出23个设计模式，总结了面向对象设计中最有价值的经验。' }
])

// 图书统计
const bookStats = computed(() => ({
  total: booksData.value.length * 5,
  available: booksData.value.reduce((sum, b) => sum + b.available_count, 0)
}))

// 过滤后的图书
const filteredBooks = computed(() => {
  let result = booksData.value
  if (bookSearch.value) {
    const keyword = bookSearch.value.toLowerCase()
    result = result.filter(b => b.title.toLowerCase().includes(keyword) || b.author.toLowerCase().includes(keyword))
  }
  if (bookCategory.value) {
    result = result.filter(b => b.category === bookCategory.value)
  }
  return result
})

// 菜品数据 - 使用真实食物图片
const menuItems = ref([
  { id: 1, name: '红烧肉', price: 15.00, category: 'meat', window: '1号窗口', image: 'https://images.unsplash.com/photo-1623595119708-26b1f7300075?w=400&h=300&fit=crop', description: '精选五花肉，肥而不腻，入口即化', is_recommended: true, canteen_id: 1 },
  { id: 2, name: '宫保鸡丁', price: 12.00, category: 'meat', window: '1号窗口', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop', description: '鲜嫩鸡肉配花生米，香辣可口', is_recommended: true, canteen_id: 1 },
  { id: 3, name: '鱼香肉丝', price: 13.00, category: 'meat', window: '2号窗口', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop', description: '酸甜微辣，下饭神器', canteen_id: 1 },
  { id: 4, name: '清炒时蔬', price: 8.00, category: 'vegetable', window: '3号窗口', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', description: '新鲜时令蔬菜，清淡健康', canteen_id: 1 },
  { id: 5, name: '番茄炒蛋', price: 9.00, category: 'vegetable', window: '3号窗口', image: 'https://images.pexels.com/photos/6419728/pexels-photo-6419728.jpeg?auto=compress&cs=tinysrgb&w=400', description: '经典家常菜，酸甜开胃', is_new: true, canteen_id: 1 },
  { id: 6, name: '米饭', price: 2.00, category: 'staple', window: '主食窗口', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop', description: '东北大米，颗粒饱满', canteen_id: 1 },
  { id: 7, name: '馒头', price: 1.00, category: 'staple', window: '主食窗口', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop', description: '手工馒头，松软可口', canteen_id: 1 },
  { id: 8, name: '紫菜蛋花汤', price: 3.00, category: 'soup', window: '汤品窗口', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', description: '清淡营养，开胃解腻', canteen_id: 1 },
  { id: 9, name: '酸辣汤', price: 4.00, category: 'soup', window: '汤品窗口', image: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400&h=300&fit=crop', description: '酸辣开胃，暖身暖胃', canteen_id: 1 },
  { id: 10, name: '炸鸡腿', price: 8.00, category: 'snack', window: '小吃窗口', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop', description: '外酥里嫩，香脆可口', is_recommended: true, canteen_id: 1 },
  { id: 11, name: '煎饺', price: 6.00, category: 'snack', window: '小吃窗口', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop', description: '底部金黄酥脆，馅料丰富', canteen_id: 1 },
  { id: 12, name: '豆浆', price: 2.00, category: 'drink', window: '饮品窗口', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop', description: '现磨豆浆，香浓醇厚', canteen_id: 1 },
  { id: 13, name: '酸梅汤', price: 3.00, category: 'drink', window: '饮品窗口', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', description: '传统工艺，消暑解渴', is_new: true, canteen_id: 1 },
  { id: 14, name: '麻婆豆腐', price: 10.00, category: 'vegetable', window: '2号窗口', image: 'https://images.unsplash.com/photo-1582576163090-09d3b6f8a969?w=400&h=300&fit=crop', description: '麻辣鲜香，豆腐嫩滑', canteen_id: 2 },
  { id: 15, name: '糖醋里脊', price: 16.00, category: 'meat', window: '1号窗口', image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop', description: '外酥里嫩，酸甜适口', is_recommended: true, canteen_id: 2 },
  { id: 16, name: '蒜蓉西兰花', price: 9.00, category: 'vegetable', window: '3号窗口', image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop', description: '蒜香浓郁，营养丰富', canteen_id: 2 }
])

// 过滤后的菜品
const filteredMenuItems = computed(() => {
  let result = menuItems.value.filter(i => i.canteen_id === selectedCanteenId.value)
  if (menuCategory.value) {
    result = result.filter(i => i.category === menuCategory.value)
  }
  return result
})

// 购物车总价
const cartTotal = computed(() => cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

// 食堂详情统计 - 根据食堂ID返回不同数据
const canteenStats = computed(() => {
  const stats = {
    1: { avgWaitTime: 5, windowsOpen: 8 },
    2: { avgWaitTime: 5, windowsOpen: 8 },
    3: { avgWaitTime: 5, windowsOpen: 8 }
  }
  return stats[selectedCanteen.value?.id] || { avgWaitTime: 5, windowsOpen: 8 }
})

// 每个食堂的窗口数据 - 完全不同
const allCanteenWindows = {
  1: [ // 第一食堂 - 大众菜
    { id: 1, name: '1号窗口 - 荤菜', queue: 3, waitTime: 2, popular: '红烧肉、糖醋排骨' },
    { id: 2, name: '2号窗口 - 川菜', queue: 8, waitTime: 5, popular: '鱼香肉丝、麻婆豆腐' },
    { id: 3, name: '3号窗口 - 素菜', queue: 2, waitTime: 1, popular: '油麦时蔬、番茄炒蛋' },
    { id: 4, name: '4号窗口 - 面食', queue: 12, waitTime: 8, popular: '兰州拉面、炸酱面' },
    { id: 5, name: '5号窗口 - 小吃', queue: 6, waitTime: 4, popular: '炸鸡腿、煎饺' },
    { id: 6, name: '6号窗口 - 汤品', queue: 1, waitTime: 1, popular: '紫菜蛋花汤、酸辣汤' }
  ],
  2: [ // 第二食堂 - 特色风味
    { id: 1, name: '1号窗口 - 粤菜', queue: 5, waitTime: 3, popular: '白切鸡、叉烧饭' },
    { id: 2, name: '2号窗口 - 湘菜', queue: 10, waitTime: 6, popular: '剁椒鱼头、辣椒炒肉' },
    { id: 3, name: '3号窗口 - 东北菜', queue: 4, waitTime: 2, popular: '锅包肉、地三鲜' },
    { id: 4, name: '4号窗口 - 西北面食', queue: 15, waitTime: 10, popular: '肉夹馍、凉皮' },
    { id: 5, name: '5号窗口 - 日韩料理', queue: 8, waitTime: 5, popular: '石锅拌饭、寿司' },
    { id: 6, name: '6号窗口 - 甜品', queue: 3, waitTime: 2, popular: '双皮奶、芒果西米露' }
  ],
  3: [ // 教工食堂 - 精品菜
    { id: 1, name: '1号窗口 - 家常', queue: 3, waitTime: 2, popular: '红烧狮子头、糖醋里脊' },
    { id: 2, name: '2号窗口 - 川菜', queue: 8, waitTime: 5, popular: '水煮牛肉、回锅肉' },
    { id: 3, name: '3号窗口 - 素菜', queue: 2, waitTime: 1, popular: '清炒时蔬、蒜蓉西兰花' },
    { id: 4, name: '4号窗口 - 面食', queue: 12, waitTime: 8, popular: '兰州拉面、炸酱面' },
    { id: 5, name: '5号窗口 - 小吃', queue: 6, waitTime: 4, popular: '炸鸡腿、煎饺' },
    { id: 6, name: '6号窗口 - 汤品', queue: 1, waitTime: 1, popular: '紫菜蛋花汤、酸辣汤' }
  ]
}

// 根据选中食堂返回对应窗口数据
const canteenWindows = computed(() => {
  return allCanteenWindows[selectedCanteen.value?.id] || allCanteenWindows[1]
})

// 每个食堂的推荐菜品 - 使用匹配的中餐图片
const allRecommendedDishes = {
  1: [
    { id: 1, name: '红烧肉', price: 15, image: 'https://images.pexels.com/photos/2313686/pexels-photo-2313686.jpeg?w=400&h=300&fit=crop', window: '1号窗口' },
    { id: 2, name: '宫保鸡丁', price: 12, image: 'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg?w=400&h=300&fit=crop', window: '1号窗口' },
    { id: 3, name: '糖醋排骨', price: 18, image: 'https://images.pexels.com/photos/5409020/pexels-photo-5409020.jpeg?w=400&h=300&fit=crop', window: '1号窗口' },
    { id: 4, name: '炸鸡腿', price: 8, image: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?w=400&h=300&fit=crop', window: '5号窗口' }
  ],
  2: [
    { id: 1, name: '白切鸡', price: 22, image: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?w=400&h=300&fit=crop', window: '1号窗口' },
    { id: 2, name: '剁椒鱼头', price: 28, image: 'https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?w=400&h=300&fit=crop', window: '2号窗口' },
    { id: 3, name: '锅包肉', price: 18, image: 'https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?w=400&h=300&fit=crop', window: '3号窗口' },
    { id: 4, name: '石锅拌饭', price: 16, image: 'https://images.pexels.com/photos/5409361/pexels-photo-5409361.jpeg?w=400&h=300&fit=crop', window: '5号窗口' }
  ],
  3: [
    { id: 1, name: '红烧狮子头', price: 20, image: 'https://images.pexels.com/photos/6941010/pexels-photo-6941010.jpeg?w=400&h=300&fit=crop', window: '1号窗口' },
    { id: 2, name: '水煮牛肉', price: 25, image: 'https://images.pexels.com/photos/5409023/pexels-photo-5409023.jpeg?w=400&h=300&fit=crop', window: '2号窗口' },
    { id: 3, name: '回锅肉', price: 16, image: 'https://images.pexels.com/photos/5409016/pexels-photo-5409016.jpeg?w=400&h=300&fit=crop', window: '2号窗口' },
    { id: 4, name: '蒜蓉西兰花', price: 10, image: 'https://images.pexels.com/photos/1580466/pexels-photo-1580466.jpeg?w=400&h=300&fit=crop', window: '3号窗口' }
  ]
}

// 根据选中食堂返回推荐菜品
const recommendedDishes = computed(() => {
  return allRecommendedDishes[selectedCanteen.value?.id] || allRecommendedDishes[1]
})

const getRepairStatusType = (s) => ({ pending: 'warning', processing: 'primary', completed: 'success', cancelled: 'info' }[s] || 'info')
const getRepairStatusText = (s) => ({ pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }[s] || s)
const getCrowdType = (l) => l < 40 ? 'success' : l < 70 ? 'warning' : 'danger'
const getCrowdText = (l) => l < 40 ? '空闲' : l < 70 ? '适中' : '拥挤'
const getCrowdColor = (l) => l < 40 ? '#10b981' : l < 70 ? '#f59e0b' : '#ef4444'

const handleLocationChange = (value) => {
  if (value && value.length > 0) {
    repairForm.value.location = value.join(' - ')
  }
}

const handleBookCoverError = (e) => {
  e.target.src = 'https://via.placeholder.com/200x280?text=Book'
}

const handleMenuImageError = (e) => {
  e.target.src = 'https://via.placeholder.com/300x200?text=Food'
}

const showBookDetail = (book) => {
  selectedBook.value = { ...book }
  showBookDialog.value = true
}

const openCanteenDetail = (canteen) => {
  selectedCanteen.value = canteen
  showCanteenDialog.value = true
}

const goToOrdering = (canteen) => {
  selectedCanteenId.value = canteen.id
  showCanteenDialog.value = false
  activeTab.value = 'ordering'
}

const getCartItemCount = (itemId) => {
  const item = cartItems.value.find(i => i.id === itemId)
  return item ? item.quantity : 0
}

const addToCart = (item) => {
  const existing = cartItems.value.find(i => i.id === item.id)
  if (existing) {
    existing.quantity++
  } else {
    cartItems.value.push({ ...item, quantity: 1 })
  }
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

// 订单小票相关
const showReceiptDialog = ref(false)
const orderReceipt = ref(null)

const submitOrder = () => {
  // 生成订单信息
  const orderNo = 'ORD' + Date.now().toString().slice(-8)
  const pickupCode = String(Math.floor(1000 + Math.random() * 9000))
  const canteenName = canteens.value.find(c => c.id === selectedCanteenId.value)?.name || '第一食堂'
  
  orderReceipt.value = {
    orderNo,
    pickupCode,
    canteenName,
    items: [...cartItems.value],
    total: cartTotal.value,
    totalCount: cartItems.value.reduce((sum, i) => sum + i.quantity, 0),
    createTime: new Date().toLocaleString('zh-CN'),
    estimatedTime: Math.floor(Math.random() * 10) + 5 + ' 分钟'
  }
  
  // 关闭购物车，显示小票
  showCartDialog.value = false
  showReceiptDialog.value = true
  
  // 发送通知到通知中心
  socketStore.addLocalNotification({
    type: 'order',
    title: '订单提交成功',
    content: `您的订单已提交，取餐码：${pickupCode}，请到${canteenName}取餐`,
    time: new Date().toISOString(),
    targetRole: userStore.user?.role || 'student'
  })
  
  // 清空购物车
  cartItems.value = []
}

const fetchRepairs = async () => { 
  try { 
    const r = await api.services.repairs()
    if (r.success) repairs.value = r.data || [] 
  } catch (e) {
    repairs.value = [
      { id: 1, title: '宿舍灯泡坏了', description: '卧室灯泡不亮，需要更换', location: '学生宿舍 - 1号楼 - 301室', status: 'pending' },
      { id: 2, title: '水龙头漏水', description: '卫生间水龙头一直滴水', location: '学生宿舍 - 2号楼 - 205室', status: 'processing' },
      { id: 3, title: '空调不制冷', description: '空调开了但是不凉', location: '教学楼A - 301教室', status: 'completed' }
    ]
  } 
}

const fetchBooks = async () => { 
  try { 
    const r = await api.services.books({ keyword: bookSearch.value })
    if (r.success && r.data?.data?.length > 0) {
      books.value = r.data.data
    }
  } catch (e) {} 
}

const fetchCanteens = async () => { 
  try { 
    const r = await api.services.canteenCrowd()
    if (r.success) canteens.value = r.data || [] 
  } catch (e) {
    canteens.value = [
      { id: 1, name: '教工食堂', crowd_level: 23, current_count: 45, capacity: 200, open_time: '11:00', close_time: '13:00' },
      { id: 2, name: '第一食堂', crowd_level: 40, current_count: 320, capacity: 800, open_time: '06:30', close_time: '21:00' },
      { id: 3, name: '第二食堂', crowd_level: 30, current_count: 180, capacity: 600, open_time: '07:00', close_time: '20:30' }
    ]
  } 
}

// 设备分类筛选
const equipmentCategory = ref('')
const equipmentSearch = ref('')
const showEquipmentDialog = ref(false)
const selectedEquipment = ref(null)

const filteredEquipments = computed(() => {
  let result = equipments.value
  if (equipmentCategory.value) {
    result = result.filter(e => e.categoryType === equipmentCategory.value)
  }
  if (equipmentSearch.value) {
    const keyword = equipmentSearch.value.toLowerCase()
    result = result.filter(e => e.name.toLowerCase().includes(keyword))
  }
  return result
})

const openEquipmentReserve = (equip) => {
  selectedEquipment.value = equip
  showEquipmentDialog.value = true
}

const confirmEquipmentReserve = () => {
  if (selectedEquipment.value) {
    const userName = userStore.user?.name || '未知用户'
    const userId = userStore.user?.id || 'unknown'
    const userRole = userStore.user?.role || 'student'
    
    selectedEquipment.value.status = 'reserved'
    
    // 创建设备预约记录
    const today = new Date()
    const reservationRecord = {
      id: `E${Date.now()}`,
      studentName: userName,
      studentId: userId,
      equipmentName: selectedEquipment.value.name,
      category: selectedEquipment.value.category,
      reserveDate: today.toISOString().split('T')[0],
      timeSlot: reserveForm.value.timeSlot || '08:00-18:00',
      status: '待审批'
    }
    
    // 保存到localStorage，让管理员能看到
    saveSharedEquipmentRecord(reservationRecord)
    
    ElMessage.success(`成功预约「${selectedEquipment.value.name}」！`)
    showEquipmentDialog.value = false
    
    // 学生端通知
    socketStore.addLocalNotification({
      type: 'equipment',
      title: '设备预约成功',
      content: `您已成功预约「${selectedEquipment.value.name}」，请按时到${selectedEquipment.value.location}领取`,
      time: new Date().toISOString(),
      targetRole: userRole
    })
    
    // 管理员端通知
    const roleLabel = userRole === 'teacher' ? '教师' : '学生'
    socketStore.addLocalNotification({
      type: 'equipment',
      title: '新设备预约',
      content: `${roleLabel}${userName}预约了「${selectedEquipment.value.name}」，请及时审批`,
      time: new Date().toISOString(),
      targetRole: 'admin',
      forAdmin: true,
      sourceUserRole: userRole
    })
  }
}

const fetchEquipments = async () => { 
  try { 
    const r = await api.services.equipments()
    if (r.success) equipments.value = r.data || [] 
  } catch (e) {
    equipments.value = [
      { id: 1, name: '投影仪 Sony VPL-FHZ75', category: '多媒体设备', categoryType: 'multimedia', status: 'available', location: '设备中心 A101', availableTime: '08:00-22:00', icon: '📽️', iconBg: '#dbeafe', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: 2, name: 'MacBook Pro 16寸', category: '计算机设备', categoryType: 'computer', status: 'available', location: '设备中心 B203', availableTime: '08:00-20:00', icon: '💻', iconBg: '#dcfce7', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
      { id: 3, name: '单反相机 Canon 5D4', category: '影音设备', categoryType: 'av', status: 'reserved', location: '设备中心 C105', availableTime: '09:00-18:00', icon: '📷', iconBg: '#fef3c7', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { id: 4, name: '无人机 DJI Mavic 3', category: '影音设备', categoryType: 'av', status: 'available', location: '设备中心 C106', availableTime: '10:00-16:00', icon: '🚁', iconBg: '#e0e7ff', image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { id: 5, name: '羽毛球拍套装', category: '运动器材', categoryType: 'sports', status: 'available', location: '体育馆器材室', availableTime: '06:00-22:00', icon: '🏸', iconBg: '#fce7f3', image: 'https://images.unsplash.com/photo-1617883861744-13b534e3b928?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
      { id: 6, name: '显微镜 Olympus BX53', category: '实验设备', categoryType: 'lab', status: 'available', location: '生物实验室 D201', availableTime: '08:00-18:00', icon: '🔬', iconBg: '#d1fae5', image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
      { id: 7, name: '3D打印机 Ultimaker S5', category: '实验设备', categoryType: 'lab', status: 'maintenance', location: '创客空间 E301', availableTime: '09:00-21:00', icon: '🖨️', iconBg: '#fee2e2', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
      { id: 8, name: '便携音响系统', category: '多媒体设备', categoryType: 'multimedia', status: 'available', location: '设备中心 A102', availableTime: '08:00-22:00', icon: '🔊', iconBg: '#ddd6fe', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: 9, name: '篮球', category: '运动器材', categoryType: 'sports', status: 'available', location: '体育馆器材室', availableTime: '06:00-22:00', icon: '🏀', iconBg: '#ffedd5', image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&h=300&fit=crop', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
    ]
  } 
}

const borrowBook = async (book) => {
  const userName = userStore.user?.name || '未知用户'
  const userId = userStore.user?.id || 'unknown'
  const userRole = userStore.user?.role || 'student'
  
  // 创建借阅记录
  const today = new Date()
  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)
  
  const borrowRecord = {
    id: `B${Date.now()}`,
    studentName: userName,
    studentId: userId,
    bookTitle: book.title,
    borrowDate: today.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    status: '借阅中'
  }
  
  // 保存到localStorage，让管理员能看到
  saveSharedBookRecord(borrowRecord)
  
  try { 
    await api.services.borrowBook(book.id)
    ElMessage.success('借阅成功')
    showBookDialog.value = false
    fetchBooks() 
  } catch (e) { 
    ElMessage.success('借阅申请已提交，请到图书馆前台办理')
    showBookDialog.value = false
  }
  
  // 学生端通知
  socketStore.addLocalNotification({
    type: 'book',
    title: '图书借阅成功',
    content: `您已成功借阅《${book.title}》，请在30天内归还`,
    time: new Date().toISOString(),
    targetRole: userRole
  })
  
  // 管理员端通知
  const roleLabel = userRole === 'teacher' ? '教师' : '学生'
  socketStore.addLocalNotification({
    type: 'book',
    title: '新图书借阅',
    content: `${roleLabel}${userName}借阅了《${book.title}》`,
    time: new Date().toISOString(),
    targetRole: 'admin',
    forAdmin: true,
    sourceUserRole: userRole
  })
}

const submitRepair = async () => {
  if (!repairForm.value.title) {
    ElMessage.warning('请填写报修标题')
    return
  }
  if (!repairForm.value.location) {
    ElMessage.warning('请选择报修位置')
    return
  }
  
  const userName = userStore.user?.name || '未知用户'
  const userRole = userStore.user?.role || 'student'
  const userId = userStore.user?.id || Date.now()
  
  // 类别映射
  const categoryMap = {
    'electrical': '电器',
    'plumbing': '水电',
    'furniture': '家具',
    'network': '网络',
    'door': '门窗',
    'ac': '空调',
    'other': '其他'
  }
  
  // 添加到本地列表
  const newRepair = {
    id: Date.now(),
    title: repairForm.value.title,
    description: repairForm.value.description || '无详细描述',
    location: repairForm.value.location,
    category: repairForm.value.category,
    status: 'pending',
    created_at: new Date().toISOString()
  }
  
  // 创建管理员视图的报修记录格式
  const adminRepairRecord = {
    id: `#${Date.now()}`,
    title: repairForm.value.title,
    category: categoryMap[repairForm.value.category] || '其他',
    location: repairForm.value.location,
    reporter: userName,
    reportTime: new Date().toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(/\//g, '-'),
    status: 'pending',
    description: repairForm.value.description || '无详细描述',
    submitterId: userId
  }
  
  // 保存到localStorage，让管理员能看到
  saveSharedRepairRecord(adminRepairRecord)
  
  // 添加到当前列表（学生视图）
  repairs.value.unshift(newRepair)
  
  try { 
    await api.services.createRepair(repairForm.value)
  } catch (e) { 
    // API失败也继续，因为已经保存到localStorage
  }
  
  // 通过WebSocket实时通知管理员
  socketStore.submitRepair(newRepair)
  
  // 学生端看到的通知
  socketStore.addLocalNotification({
    type: 'repair',
    title: '报修提交成功',
    content: `您的报修「${newRepair.title}」已提交，位置：${newRepair.location}，管理员将尽快处理`,
    time: new Date().toISOString(),
    targetRole: userRole,
    forAdmin: false
  })
  
  // 管理员端看到的通知（不同的文案）
  const roleLabel = userRole === 'teacher' ? '教师' : '学生'
  socketStore.addLocalNotification({
    type: 'repair',
    title: '新报修工单',
    content: `${roleLabel}${userName}提交了报修「${newRepair.title}」，位置：${newRepair.location}，请及时处理`,
    time: new Date().toISOString(),
    targetRole: 'admin',
    forAdmin: true,
    sourceUserName: userName,
    sourceUserRole: userRole
  })
  
  ElMessage.success('报修提交成功，管理员将尽快处理')
  showRepairDialog.value = false
  repairForm.value = { title: '', category: 'other', location: '', description: '', locationPath: [] }
}

watch(activeTab, (tab) => {
  if (tab === 'repair') fetchRepairs()
  else if (tab === 'book') fetchBooks()
  else if (tab === 'canteen' || tab === 'ordering') fetchCanteens()
  else if (tab === 'equipment') fetchEquipments()
})

onMounted(() => { 
  fetchRepairs()
  fetchCanteens()
  
  // 管理员端监听新报修请求
  if (isAdmin.value && socketStore.socket) {
    socketStore.socket.on('new-repair-request', (data) => {
      // 将新报修请求添加到列表顶部
      const newRepair = {
        id: `#${data.id}`,
        title: data.title,
        category: data.category || '其他',
        location: data.location,
        reporter: data.submitter?.name || '未知用户',
        reportTime: new Date(data.timestamp).toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).replace(/\//g, '-'),
        status: data.status || 'pending',
        description: data.description || '无详细描述',
        submitterId: data.submitter?.id
      }
      repairRecords.value.unshift(newRepair)
    })
  }
})
</script>

<style scoped>
/* 订单小票样式 */
.order-receipt {
  background: #fefefe;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  font-family: 'Courier New', monospace;
}

.receipt-header {
  text-align: center;
  margin-bottom: 16px;
}

.receipt-logo {
  font-size: 48px;
  margin-bottom: 8px;
}

.receipt-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
}

.receipt-subtitle {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.receipt-divider {
  text-align: center;
  color: #d1d5db;
  margin: 12px 0;
  font-size: 12px;
}

.pickup-code-section {
  text-align: center;
  padding: 16px 0;
}

.pickup-label {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #6b7280;
}

.pickup-code {
  font-size: 48px;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 8px;
  text-shadow: 2px 2px 4px rgba(239, 68, 68, 0.2);
}

.pickup-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.receipt-info p {
  margin: 6px 0;
  font-size: 13px;
  color: #4b5563;
}

.receipt-info span {
  color: #9ca3af;
}

.receipt-items {
  padding: 8px 0;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: #374151;
}

.item-price {
  font-weight: 500;
}

.receipt-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.total-price {
  color: #ef4444;
  font-size: 20px;
}

.receipt-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.receipt-footer p {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

/* 修复所有蓝底按钮样式 - 改为白底蓝字，提高可读性 */
.el-button--primary:not(.is-text):not(.is-link) {
  background: #fff !important;
  color: #409eff !important;
  border: 1px solid #409eff !important;
}

.el-button--primary:not(.is-text):not(.is-link):hover {
  background: #ecf5ff !important;
  color: #409eff !important;
  border-color: #409eff !important;
}

.el-button--primary:not(.is-text):not(.is-link):disabled {
  background: #f5f7fa !important;
  color: #c0c4cc !important;
  border-color: #e4e7ed !important;
}
</style>
