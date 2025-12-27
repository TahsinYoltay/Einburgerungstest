#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT_DIR/android/keystore.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

required_vars=(
  ANDROID_KEYSTORE_PATH
  ANDROID_KEYSTORE_PASSWORD
  ANDROID_KEY_ALIAS
  ANDROID_KEY_PASSWORD
)

missing=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if (( ${#missing[@]} )); then
  echo "Missing signing variables: ${missing[*]}"
  echo "Create $ENV_FILE (copy from android/keystore.env.example) or export them in your shell."
  exit 1
fi

keystore_path="${ANDROID_KEYSTORE_PATH}"
if [[ "$keystore_path" != /* ]]; then
  if [[ ! -f "$ROOT_DIR/android/$keystore_path" ]]; then
    echo "Keystore not found at: $ROOT_DIR/android/$keystore_path"
    exit 1
  fi
else
  if [[ ! -f "$keystore_path" ]]; then
    echo "Keystore not found at: $keystore_path"
    exit 1
  fi
fi

chmod 600 "$ENV_FILE" 2>/dev/null || true
if [[ "$keystore_path" != /* ]]; then
  chmod 600 "$ROOT_DIR/android/$keystore_path" 2>/dev/null || true
else
  chmod 600 "$keystore_path" 2>/dev/null || true
fi

pushd "$ROOT_DIR/android" >/dev/null
./gradlew clean
./gradlew :react-native-reanimated:assembleRelease
./gradlew bundleRelease
popd >/dev/null

echo "Closed testing AAB: $ROOT_DIR/android/app/build/outputs/bundle/release/app-release.aab"
