# 后端数据库

`migrations/001_create_user_table.sql` 是网站用户注册的初始数据库迁移；`migrations/002_create_userproblem_and_session.sql` 创建任务、附件和登录会话表。

用户表为 `public."user"`，注册接口应写入 `password_hash`，不要保存明文密码。应用运行时使用池化的 `DATABASE_URL`；执行迁移时使用 Neon 的直连地址。

字段覆盖：邮箱、密码哈希、用户名、显示名、头像、手机号、角色、账号状态、邮箱验证时间、最后登录时间、登录失败次数、锁定时间，以及创建/更新时间。

任务表 `public.userproblem` 使用 `status` 数字状态：`1` 新问题、`2` 正在解决中、`3` 已解决。附件保存在 `public.userproblem_attachment.content` 的 `BYTEA` 字段中，应用层限制单文件 10MB、每个任务最多 5 个附件。登录会话保存在 `public.user_session`，浏览器只保存 HttpOnly Cookie。
