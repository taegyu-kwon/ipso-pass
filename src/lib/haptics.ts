import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// 웹에서는 진동이 없으니 건너뛴다
const native = Platform.OS !== 'web';

export const haptic = {
  // 버튼·아이콘을 눌렀을 때 가벼운 탭
  tap: () => {
    if (native) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  // NFC 태그 인식, 잠금 완료 등 성공 순간
  success: () => {
    if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
