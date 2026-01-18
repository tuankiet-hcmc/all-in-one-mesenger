# Hướng dẫn sử dụng All-in-One Chat

## 🚀 Khởi động

```bash
npm start
```

## 📝 Thêm Chat Tab

### Cách 1: Từ màn hình chính (khi chưa có tabs)
1. Click nút **"Add Chat Application"** màu xanh ở giữa màn hình

### Cách 2: Từ sidebar
1. Click nút **"+"** bên cạnh "Your Chats" trong sidebar bên trái

### Điền thông tin:
- **Title**: Tên ứng dụng chat (vd: WhatsApp, Telegram, Zalo, Slack)
- **URL**: Link HTTPS của web chat (vd: https://web.whatsapp.com)
- **Partition**: Tự động tạo, KHÔNG cần chỉnh sửa

### Ví dụ các ứng dụng phổ biến:
- **WhatsApp**: https://web.whatsapp.com
- **Telegram**: https://web.telegram.org
- **Zalo**: https://chat.zalo.me
- **Messenger**: https://www.messenger.com
- **Slack**: https://app.slack.com
- **Discord**: https://discord.com/app

3. Click **"Save Tab"**

## 🔄 Chuyển đổi giữa các Chat

- Click vào tên chat trong **sidebar bên trái**
- Chat sẽ hiển thị trong khu vực chính
- Tab đang active được tô sáng màu xanh

## ⚙️ Quản lý Tabs

1. Click **"Manage Tabs"** ở cuối sidebar
2. Xem bảng danh sách tất cả các tabs với:
   - Title, URL, Partition, Status
   - Nút Actions (⋮) để Edit hoặc Delete

### Chỉnh sửa Tab:
1. Click nút **⋮** → **Edit**
2. Sửa Title hoặc URL
3. **Lưu ý**: Partition KHÔNG thể sửa để giữ session/login

### Xóa Tab:
1. Click nút **⋮** → **Delete**
2. Xác nhận xóa
3. Tab và dữ liệu session sẽ bị xóa vĩnh viễn

## 📋 Copy Partition

- Trong bảng quản lý hoặc form, click icon **Copy** bên cạnh partition
- Partition được copy vào clipboard

## 🔙 Quay lại Chats

- Trong màn hình quản lý, click nút **"Back to Chats"** ở góc phải trên

## 💡 Tips

- Mỗi chat có **session riêng biệt** (partition), không bị xung đột đăng nhập
- **Favicon tự động cập nhật** khi trang chat load xong
- **Thông báo tin nhắn mới** tự động hiển thị
- Dữ liệu được **lưu tự động**, không mất khi tắt app
- Chỉ chấp nhận **URL HTTPS** để đảm bảo bảo mật

## 🐛 Khắc phục sự cố

### Chat không load?
- Kiểm tra URL có đúng và bắt đầu bằng `https://`
- Thử reload lại app
- Xóa tab và thêm lại

### Không thấy sidebar tabs?
- Đảm bảo đã thêm ít nhất 1 tab
- Reload app

### Session/Login bị mất?
- Không xóa hoặc sửa Partition
- Partition khóa trong chế độ Edit để tránh mất session
