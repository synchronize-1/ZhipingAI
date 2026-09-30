import request from './request'

// 校园服务（图书 / 食堂）
export const serviceAPI = {
  books: params => request.get('/services/books', { params }),
  borrowBook: id => request.post(`/services/books/${id}/borrow`),
  canteenCrowd: () => request.get('/services/canteens/crowd'),
  menu: canteenId => request.get(`/services/canteens/${canteenId}/menu`)
}

export default serviceAPI