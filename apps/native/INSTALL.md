# 回声 Native 安装与发布

## 1. 配置地址

修改 `eas.json`：

- `development`：填写同一局域网内电脑的 API/Web 地址。
- `preview` / `production`：替换为正式 HTTPS 地址。

不要把数据库密码或其他私钥放入 `EXPO_PUBLIC_*` 变量。

## 2. 开发包

Native NFC、BLE 需要自定义 Development Build，不能依赖 Expo Go。

```bash
cd apps/native
pnpm install
pnpm exec expo install expo-dev-client
pnpm exec eas login
pnpm exec eas build --platform android --profile development
pnpm exec eas build --platform ios --profile development
pnpm exec expo start --dev-client
```

Android 生成 APK 后，可从 EAS 页面或 CLI 提供的链接安装。iOS 真机开发包需要 Apple Developer 账号和已注册设备。

## 3. 内测安装包

```bash
cd apps/native
pnpm exec eas build --platform android --profile preview
pnpm exec eas build --platform ios --profile preview
```

Android `preview` 是可直接安装的 APK。iOS `preview` 使用 Ad Hoc，需要先登记测试设备：

```bash
pnpm exec eas device:create
pnpm exec eas build --platform ios --profile preview
```

每增加一台 iPhone，Ad Hoc 包通常需要重新构建或重新签名。

## 4. 商店包

```bash
cd apps/native
pnpm exec eas build --platform android --profile production
pnpm exec eas build --platform ios --profile production
```

- Android：上传 AAB 到 Google Play Console。
- iOS：上传到 App Store Connect，再通过 TestFlight 或 App Store 安装。

需要 Google Play Developer 账号；iOS 真机发布需要 Apple Developer Program 账号。

## 5. 本机编译

Windows 可以构建 Android，但不能本地编译 iOS；iOS 使用 EAS 云构建或 macOS + Xcode。

```bash
cd apps/native
pnpm exec expo prebuild --clean
pnpm exec expo run:android --device
pnpm exec expo run:ios --device
```

安装或升级原生 BLE/NFC 库、修改 `app.json` 后，需要重新 `prebuild` 并重新安装 Development Build。

## 6. “碰一碰”能力

两台 App 都打开并停留在回声页时，Native App 会：

1. BLE 广播 `ECHO_NEAR`；
2. BLE 扫描同一服务 UUID；
3. 发现附近设备后调用 `/proximity/announce`；
4. 服务端生成临时 proximity session；
5. 两台 App 打开同一个 Web 游戏 URL；
6. 游戏状态通过 WebSocket 同步。

NFC 仍用于实体隐藏卡，不用于手机间数据传输。

BLE 只能判断附近设备，无法证明两台手机发生了物理接触。系统权限关闭、设备不支持 BLE 外设模式或后台限制时，使用 QR 兜底。
