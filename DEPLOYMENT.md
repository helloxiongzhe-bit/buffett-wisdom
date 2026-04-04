# GitHub Pages 部署指南

## 前置条件
- GitHub 账户（需要先在 https://github.com 注册）
- Git 已配置用户信息

## 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 输入仓库名称，例如：`buffett-wisdom`
3. 选择 **Public**（公开）或 **Private**（私有）
   - ⚠️ **注意**：私有仓库需要升级到 GitHub Pro 或 GitHub Team 才能使用 GitHub Pages
   - 免费账户必须使用 Public 仓库
4. 不要勾选 "Initialize this repository with a README"
5. 点击 **Create repository**

## 第二步：关联远程仓库并推送

在终端执行以下命令（将 `YOUR_USERNAME` 替换为你的 GitHub 用户名）：

```bash
git remote add origin https://github.com/YOUR_USERNAME/buffett-wisdom.git
git branch -M main
git push -u origin main
```

**如果遇到认证问题，可能需要使用 SSH：**

```bash
git remote set-url origin git@github.com:YOUR_USERNAME/buffett-wisdom.git
git push -u origin main
```

## 第三步：启用 GitHub Pages

1. 访问你的仓库页面
2. 点击 **Settings** 标签页
3. 在左侧菜单中找到并点击 **Pages**
4. 在 "Build and deployment" 部分：
   - **Source**：选择 `Deploy from a branch`
   - **Branch**：选择 `main` 分支，文件夹选择 `/ (root)`
5. 点击 **Save**

## 第四步：等待部署完成

1. GitHub 会自动构建和部署你的网站
2. 等待 1-5 分钟（首次部署可能需要更长时间）
3. 在 Pages 页面顶部会显示部署状态
4. 成功后会显示你的网站 URL，格式为：
   - `https://YOUR_USERNAME.github.io/buffett-wisdom/`

## 第五步：访问你的网站

打开浏览器访问显示的 URL，你的静态网站就已经上线了！

## 更新网站

以后当你修改代码后，只需：

```bash
git add .
git commit -m "Update website"
git push
```

GitHub Pages 会自动重新部署。

## 自定义域名（可选）

如果想要使用自己的域名：

1. 在仓库的 **Pages** 设置中，找到 "Custom domain"
2. 输入你的域名，如 `www.yourdomain.com`
3. 点击 **Save**
4. 根据提示配置你的域名 DNS 记录

## 故障排查

**部署失败？**
- 检查 Pages 设置页面是否有错误信息
- 确保仓库是 Public（免费账户）
- 查看 Actions 标签页查看部署日志

**网站样式丢失？**
- 检查 CSS 文件路径是否正确
- 确保所有资源文件都已提交

**页面 404？**
- 等待几分钟让部署完成
- 确认仓库名称在 URL 中正确

## 需要帮助？

- GitHub Pages 文档：https://docs.github.com/pages
- 如果遇到问题，检查仓库的 Actions 标签页查看部署日志
