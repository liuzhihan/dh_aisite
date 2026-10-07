# dh_aisite

大瀚 AI 工作室官网：AI 创意与技术服务个人工作室网站。

## 项目结构

- `front/`：纯 HTML/CSS/JavaScript 静态官网
- `back/`：后续预留的后端目录

## 本地预览

```bash
python3 -m http.server 4173 --directory front
```

然后访问 <http://localhost:4173/>。

## Vercel 部署

将项目根目录设置为 `front`，无需构建命令，直接使用静态文件部署。
