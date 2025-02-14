# 全球大学排名比较系统

这是一个基于Flask的Web应用程序，可以让用户比较和分析全球不同大学在主要排名系统（QS、THE、ARWU）中的表现。

## 主要功能

- 多排名系统整合：集成QS、THE和ARWU三大权威排名系统的数据
- 大学比较：支持同时比较最多5所大学的排名情况
- 模糊搜索：支持大学名称的模糊搜索功能
- 趋势分析：可视化展示大学在不同年份的排名变化趋势
- 响应式设计：支持各种设备的访问

## 技术栈

- 后端：Python Flask
- 前端：HTML, CSS, JavaScript
- 数据可视化：Chart.js
- 数据存储：CSV文件

## 安装说明

1. 克隆仓库：
```bash
git clone [你的仓库URL]
cd [仓库名称]
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 运行应用：
```bash
python app.py
```

4. 在浏览器中访问：
```
http://localhost:5000
```

## 使用方法

1. 在搜索框中输入大学名称（支持模糊搜索）
2. 选择想要比较的大学（最多5所）
3. 查看不同排名系统中的排名对比
4. 点击趋势分析查看历年排名变化

## 数据来源

- QS World University Rankings
- Times Higher Education World University Rankings
- Academic Ranking of World Universities (ARWU)

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个项目。

## 许可证

MIT License 