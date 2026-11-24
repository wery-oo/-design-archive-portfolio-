# Design Archive — Personal Portfolio

一个正在开发中的个人设计师作品集网站，覆盖产品设计、UI / UX 与文创设计。当前阶段先建立清晰的视觉语言、内容框架和交互原型，不提前填充真实项目。

> Outside = Personality / Inside = System

## 当前开发状态

状态：`Prototype / In Progress`

查看 [Cloudflare Pages 站点](https://design-archive-portfolio.pages.dev/)。

- [x] 首页符号矩阵 `PORTFOLIO` 标题与固定「简历 / 作品 / 联系」导航
- [x] 透明 X-Ray 安检包与五件可拖放物品，支持落底和碰撞
- [x] 侧视传送带同步驱动滚轴、轮子和包体进场，包体制动带动物品惯性
- [x] 首页滚动放大安检包，在同一视口进入五件物品的横向展示
- [x] 独立作品页，五条占位作品支持符号解码、方向翻条和跑马
- [x] 独立简历页，保留旋转字符半身像、个人档案与经历占位
- [x] 三页共用 `visual-system.css`，统一字体、扫描票据和导航样式
- [x] 独立联系互动界面，首页横向展示末尾也提供六项联系方式占位
- [x] 标题、传送带和目录提供减少动态效果模式
- [ ] 首页最终构图、包体接触与拖放手感确认
- [ ] 人物过场、简介滚动和目录交互的跨设备验证
- [ ] 真实项目内容与项目详情页
- [ ] 自定义域名与性能优化

![当前首页实拍：符号矩阵标题、透明 X-Ray 安检包和侧视传送带](./cover-preview.png)

## 设计主题

网站以个人档案与安检扫描为视觉母题，组合以下语言：

- Korean Experimental Editorial
- Personal Archive / Database
- Neo-Brutalist / Swiss Typography
- X-Ray / Transparent Object
- Halftone / Dot Matrix / Barcode / Scan / Mono

首页负责自由、彩色、实验性的 `Personality`；作品索引负责理性、黑白、编号化的 `System`。两部分通过字体、网格、标签、编号、扫描纹理与 Archive 体系统一。

## 技术与工具

- HTML5：语义化页面、Dialog 档案面板与可访问性结构
- CSS3：响应式网格、扫描纹理、Halftone、排版和动效
- Vanilla JavaScript：符号矩阵、传送带与拖放物理、滚动过场及作品目录交互
- Three.js：简历页三维字符半身像，支持旋转和滚动驱动的聚散
- PNG 透明素材：X-Ray 包体与内部物件分层
- Git / GitHub：版本管理、开发记录与展示
- Codex：协助代码维护、文档整理、检查与自动化

详细的设计原则、开发流程与目录说明见 [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)。

## 本地预览

无需安装依赖，直接打开 `index.html`，再从顶部导航进入 `resume.html` 或 `works.html`。也可以在项目目录启动任意静态文件服务器：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 每日记录

每天的开发内容、文件变更、验证结果与下一步会记录在 [`worklog/`](./worklog/) 中。自动整理按上次成功同步以来的变更核对进度，排除缓存、临时文件和本地配置。

## 内容状态

当前作品、实习经历与联系方式仍待补充。

