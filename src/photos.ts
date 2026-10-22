import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

export type PhotoSource = 'camera' | 'library';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.7, // keeps photos ~200–500 KB so storage stays small
};

/** Ask for the permission this source needs; offers a shortcut to Settings if it was denied before. */
async function ensurePermission(source: PhotoSource): Promise<boolean> {
  const { granted, canAskAgain } =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (granted) return true;

  const what = source === 'camera' ? 'camera' : 'photos';
  Alert.alert(
    `Allow access to your ${what}`,
    `To add a photo of the animal, allow access to your ${what}.`,
    canAskAgain
      ? [{ text: 'OK' }]
      : [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
  );
  return false;
}

/**
 * The picker returns a file in the cache directory, which the OS may clear.
 * Copy it into the app's documents folder so the photo survives restarts.
 */
async function persist(uri: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const dir = new Directory(Paths.document, 'animal-photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(dir, `animal-${Date.now()}.${ext}`);
  await new File(uri).copy(dest);
  return dest.uri;
}

/** Opens the camera or photo library and returns a persistent file URI, or null if cancelled. */
export async function pickAnimalPhoto(source: PhotoSource): Promise<string | null> {
  try {
    if (!(await ensurePermission(source))) return null;
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets?.length) return null;
    return await persist(result.assets[0].uri);
  } catch (e) {
    Alert.alert(
      source === 'camera' ? 'Camera unavailable' : 'Could not open photos',
      e instanceof Error ? e.message : 'Please try again.',
    );
    return null;
  }
}
