# MFE Workspace

Monorepo สำหรับทดลอง Micro-Frontend ระหว่าง Angular Host กับ Angular/React/Vue Remotes

## โครงสร้างหลัก

- `angular-host/` - Angular host app
- `angular-mfe/` - Angular remotes (`mfe1`, `mfe2`)
- `react-mfe/` - React remotes (`props`, `window-event`, `window-event-collision`)
- `vue-mfe/` - Vue remotes (`props/callback`, `window-event`)

## Install

จาก root (`mfe-workspace`)

```bash
npm run install:all
```

คำสั่งนี้จะติดตั้ง dependency ของ:
- root workspace
- `angular-host`
- `angular-mfe`
- `react-mfe`
- `vue-mfe`

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
npm run build:react-window-collision
npm run build:vue
npm run build:vue-window
```

## Docker

```bash
npm run docker:up
npm run docker:down
```

## เอกสารละเอียด

ดูสรุปทั้งหมดที่:

- [docs/micro-frontend-guide.md](docs/micro-frontend-guide.md)
