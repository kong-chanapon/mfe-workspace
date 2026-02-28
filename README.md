# MFE Workspace

Monorepo สำหรับทดลอง Micro-Frontend ระหว่าง Angular Host กับ Angular/React/Vue Remotes

## โครงสร้างหลัก

- `angular-host/` - Angular host app
- `angular-mfe/` - Angular remotes (`mfe1`, `mfe2`)
- `react-mfe/` - React remotes (`props` และ `window-event`)
- `vue-mfe/` - Vue remote

## Quick Start

จาก root (`mfe-workspace`)

```bash
npm run start:all
```

เปิดที่:

- `http://localhost:4200` (Host)

## Build

```bash
npm run build:host
npm run build:mfe1
npm run build:mfe2
npm run build:react
npm run build:react-window
npm run build:vue
```

## Docker

```bash
npm run docker:up
npm run docker:down
```

## เอกสารละเอียด

ดูสรุปทั้งหมดที่:

- [docs/micro-frontend-guide.md](docs/micro-frontend-guide.md)
