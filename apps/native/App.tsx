import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Canvas, Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia'
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { WebView } from 'react-native-webview'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000'
const GAME_URL = process.env.EXPO_PUBLIC_GAME_URL ?? 'http://10.0.2.2:5173'
const queryClient = new QueryClient()

type Room = { slug: string; title: string; gameUrl: string }
type ChatMessage = { id: string; text: string; mine: boolean }

function App() {
  const [gameOpen, setGameOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [socket, setSocket] = useState<WebSocket>()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', text: '先从一个破冰问题开始吧：今晚你最期待遇到什么样的人？', mine: false },
  ])
  const scale = useSharedValue(1)
  const ringScale = useSharedValue(1)

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: 1.5 - ringScale.value * 0.5,
  }))

  const room = useQuery({
    queryKey: ['room', 'first-meet'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/rooms/first-meet`)
      if (!response.ok) throw new Error('room unavailable')
      return response.json() as Promise<Room>
    },
  })

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.06, { duration: 2400 }), -1, true)
    ringScale.value = withRepeat(withTiming(1.22, { duration: 2400 }), -1, false)
    NfcManager.start().catch(() => undefined)
    Notifications.requestPermissionsAsync().catch(() => undefined)
    const connection = new WebSocket(API_URL.replace(/^http/, 'ws') + '/ws')
    connection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string; content?: string }
        const content = data.content
        if (data.type === 'message' && typeof content === 'string') {
          setMessages((current) => [...current, { id: `${Date.now()}`, text: content, mine: false }])
        }
      } catch {
        /* ignore malformed realtime events */
      }
    }
    setSocket(connection)
    return () => connection.close()
  }, [scale, ringScale])

  async function scanNfc() {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef)
      const tag = await NfcManager.getTag()
      const record = tag?.ndefMessage?.find((item) => item.type?.[0] === Ndef.TNF_WELL_KNOWN)
      if (!record?.payload) throw new Error('未读取到 NDEF 链接')
      await Linking.openURL(Ndef.uri.decodePayload(Uint8Array.from(record.payload)))
    } catch (error) {
      Alert.alert('NFC 交互', error instanceof Error ? error.message : '读取已取消')
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => undefined)
    }
  }

  function sendMessage() {
    const text = draft.trim()
    if (!text) return
    socket?.send(text)
    setMessages((current) => [...current, { id: `${Date.now()}`, text, mine: true }])
    setDraft('')
  }

  if (gameOpen) return <WebView source={{ uri: room.data?.gameUrl ?? GAME_URL }} onError={() => setGameOpen(false)} />

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Group>
          <Circle cx={190} cy={160} r={260}>
            <RadialGradient c={vec(190, 160)} r={260} colors={['#25446c88', '#070c1700']} />
          </Circle>
        </Group>
      </Canvas>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>HEIKESONG <Text style={styles.brandEm}>/ 初见</Text></Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>OFFLINE READY</Text>
          </View>
        </View>

        {/* Totem Sphere Hero */}
        <View style={styles.heroCenter}>
          <Animated.View style={[styles.auraOuterRing, ringStyle]} />
          <Animated.View style={[styles.aura, auraStyle]}>
            <Text style={styles.mark}>见</Text>
          </Animated.View>
        </View>

        {/* Hero Typography */}
        <View style={styles.textContainer}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>✦ PHYSICAL ICEBREAKER</Text>
          </View>
          <Text style={styles.title}>一次碰触，{`\n`}<Text style={styles.titleGold}>开启心智共振。</Text></Text>
          <Text style={styles.copy}>
            {room.data?.title ?? '实时破冰场已就绪'} · 线下相遇，8 道卡牌测算社交基因。
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.ctaGroup}>
          <Pressable style={styles.primary} onPress={() => setGameOpen(true)}>
            <Text style={styles.primaryText}>进入破冰游戏场</Text>
            <View style={styles.arrowBox}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </Pressable>

          <Pressable style={styles.secondary} onPress={scanNfc}>
            <Text style={styles.secondaryIcon}>⌁</Text>
            <Text style={styles.secondaryText}>碰一碰 NFC 标签</Text>
          </Pressable>
        </View>

        {/* Tab Controls */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.action, profileOpen && styles.actionActive]}
            onPress={() => setProfileOpen((value) => !value)}
          >
            <Text style={[styles.actionText, profileOpen && styles.actionTextActive]}>
              {profileOpen ? '收起我的档案' : '我的初见档案'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.action, chatOpen && styles.actionActive]}
            onPress={() => setChatOpen((value) => !value)}
          >
            <Text style={[styles.actionText, chatOpen && styles.actionTextActive]}>
              {chatOpen ? '收起实时破冰' : '实时破冰房'}
            </Text>
          </Pressable>
        </View>

        {/* Profile Card Drawer */}
        {profileOpen && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>PERSONA MATRIX</Text>
              <Text style={styles.panelSub}>初见档案</Text>
            </View>
            <Text style={styles.profileName}>未命名旅人</Text>
            <Text style={styles.panelCopy}>设定一个专属称谓，给线下相遇留下优雅的第一印象。</Text>
            <TextInput placeholder="输入你的昵称 (例如: 南星)" placeholderTextColor="#74839b" style={styles.input} />
          </View>
        )}

        {/* Realtime Chat Drawer */}
        {chatOpen && (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>REALTIME CHANNEL</Text>
              <Text style={styles.panelSub}>破冰房 · first-meet</Text>
            </View>
            <View style={styles.chatList}>
              {messages.map((message) => (
                <View key={message.id} style={[styles.message, message.mine && styles.messageMine]}>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={sendMessage}
                placeholder="发送破冰消息..."
                placeholderTextColor="#74839b"
                style={styles.chatInput}
              />
              <Pressable style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.send}>发送</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070c17' },
  content: { padding: 24, paddingTop: 18, paddingBottom: 60 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f1c668' },
  brand: { color: '#f4efe3', fontSize: 13, fontWeight: '700', letterSpacing: 1.8 },
  brandEm: { color: '#f1c668', fontWeight: '400' },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#0e1b30', borderWidth: 1, borderColor: '#b9d3ff22' },
  statusText: { color: '#b9d3ff', fontSize: 10, letterSpacing: 1, fontWeight: '600' },

  heroCenter: { alignItems: 'center', justifyContent: 'center', marginVertical: 24, height: 180 },
  auraOuterRing: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: '#f1c66833' },
  aura: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#f1c668',
    backgroundColor: '#0e1b30cc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f1c668',
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  mark: { color: '#f1c668', fontSize: 58, fontWeight: '700' },

  textContainer: { marginBottom: 32 },
  badgePill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#f1c66818', borderWidth: 1, borderColor: '#f1c66844', marginBottom: 14 },
  badgeText: { color: '#f1c668', fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  title: { color: '#f4efe3', fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.8 },
  titleGold: { color: '#f1c668' },
  copy: { color: '#b6c2d3', fontSize: 15, lineHeight: 22, marginTop: 12 },

  ctaGroup: { gap: 12, marginBottom: 20 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1c668',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#f1c668',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  primaryText: { color: '#070c17', fontSize: 16, fontWeight: '700' },
  arrowBox: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#070c1722', alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: '#070c17', fontWeight: '700', fontSize: 14 },

  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#b9d3ff28',
    backgroundColor: '#0e1b30',
  },
  secondaryIcon: { color: '#f1c668', fontSize: 18, fontWeight: '700' },
  secondaryText: { color: '#f4efe3', fontSize: 15, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  action: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#0e1b30', borderRadius: 10, borderWidth: 1, borderColor: '#b9d3ff18' },
  actionActive: { borderColor: '#f1c668', backgroundColor: '#142540' },
  actionText: { color: '#b6c2d3', fontSize: 13, fontWeight: '500' },
  actionTextActive: { color: '#f1c668', fontWeight: '600' },

  panel: { marginTop: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#b9d3ff24', backgroundColor: '#0e1b30f0' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#b9d3ff14' },
  panelTitle: { color: '#f1c668', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  panelSub: { color: '#74839b', fontSize: 11 },
  profileName: { color: '#f4efe3', fontSize: 20, fontWeight: '700', marginTop: 4 },
  panelCopy: { color: '#b6c2d3', fontSize: 13, lineHeight: 18, marginTop: 6 },
  input: { marginTop: 14, padding: 12, color: '#f4efe3', borderRadius: 8, backgroundColor: '#142540', borderWidth: 1, borderColor: '#b9d3ff24' },

  chatList: { gap: 8, marginVertical: 10, maxHeight: 220 },
  message: { alignSelf: 'flex-start', padding: 10, paddingHorizontal: 14, borderRadius: 12, maxWidth: '85%', backgroundColor: '#142540' },
  messageMine: { alignSelf: 'flex-end', backgroundColor: '#25446c' },
  messageText: { color: '#f4efe3', fontSize: 14, lineHeight: 20 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  chatInput: { flex: 1, padding: 10, paddingHorizontal: 14, color: '#f4efe3', borderRadius: 8, backgroundColor: '#142540', borderWidth: 1, borderColor: '#b9d3ff24' },
  sendBtn: { paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#f1c668', borderRadius: 8 },
  send: { color: '#070c17', fontWeight: '700', fontSize: 13 },
})
