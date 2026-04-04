# 巴菲特智慧网站

关于沃伦·巴菲特的智慧、股东信和投资理念的资源集合。

## 项目结构

- `index.html` - 主页
- `site/` - 网站主要内容
  - `index.html` - 站点首页
  - `styles.css` - 样式文件
  - `letters.html` - 股东信
  - `meetings.html` - 股东大会
  - `videos.html` - 视频资源
  - `glossary.html` - 术语表
  - `people.html` - 相关人物
  - `games.html` - 游戏页面
  - `components/` - 组件文件
  - `data/` - 数据文件
- `games/` - 游戏模块

## 本地运行

1. 在项目目录启动一个本地服务器：
   ```bash
   # 使用 Python 3
   python -m http.server 8000
   
   # 或使用 Node.js 的 http-server
   npx http-server
   ```

2. 在浏览器访问 `http://localhost:8000`

## 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. 在 "Source" 下选择 `Deploy from a branch`
4. 选择分支（如 `main`）和文件夹（根目录 `/`）
5. 点击 Save

网站将在几分钟后通过 GitHub Pages 发布。

## 在线访问

部署成功后，网站地址为：
`https://[你的用户名].github.io/[仓库名]/`

## 许可证

MIT License
