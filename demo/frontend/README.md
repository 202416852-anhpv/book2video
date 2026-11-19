# Book2Video Frontend Demo

Frontend prototype cho dự án Book2Video (Story2Video) xây dựng bằng React 19, Vite, Tailwind CSS v4 và Base UI / Shadcn.

## Yêu cầu môi trường
- Node.js >= 18 (khuyến nghị v20 hoặc v22)
- npm >= 9

## Cài đặt & Khởi chạy

```bash
# Cài đặt dependencies
npm install

# Khởi chạy server development
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview
```

## Cấu hình Deploy Vercel
Thư mục chứa sẵn file [vercel.json](file:///home/anhpv/Tutorials/Vbee/book2video/demo/frontend/vercel.json) với cấu hình rewrite phục vụ Single Page Application (SPA).

Khi import dự án lên Vercel:
- **Framework Preset**: Vite
- **Root Directory**: `demo/frontend` (nếu deploy từ repository gốc) hoặc `.` (nếu tạo repo riêng từ `demo/frontend`).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
