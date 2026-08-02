<script setup lang="ts">
defineProps<{
  show: boolean;
}>();

function handleRefresh() {
  window.location.reload();
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
      <!-- 半透明遮罩 -->
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <!-- 通知卡片 -->
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-down">
        <!-- 圖示 -->
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>

        <!-- 標題與內容 -->
        <h3 class="text-xl font-bold text-center text-gray-900 mb-2">網站已更新</h3>
        <p class="text-center text-gray-600 mb-6">偵測到新版本，請重新整理頁面以獲得最佳體驗。</p>

        <!-- 按鈕 -->
        <button
          @click="handleRefresh"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          立即重新整理
        </button>

        <!-- 小提示 -->
        <p class="text-xs text-gray-400 text-center mt-3">或按 Ctrl+R / ⌘+R 手動重新整理</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.4s ease-out;
}
</style>
