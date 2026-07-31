<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from "vue";
import {
  cartLines,
  cartTotal,
} from "../composables/presentation";
import PaymentStatusToggle from "./PaymentStatusToggle.vue";
import MenuCatalog from "./MenuCatalog.vue";
import type { Cart } from "../types";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  tableNum: number | null;
  hasOrders: boolean;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [cart: Cart, note: string, paid: boolean];
}>();

const tableCart = reactive<Cart>({});
const tableNote = ref("");
const tablePaid = ref(false);
const submitting = ref(false);
const bottomBarRef = ref<HTMLElement | null>(null);
const bottomBarHeight = ref(120);

const lines = computed(() => cartLines(tableCart));
const total = computed(() => cartTotal(tableCart));
const menuPaddingBottom = computed(() => `${bottomBarHeight.value + 20}px`);

function removeTableCartItem(lineId: string) {
  delete tableCart[lineId];
}

function handleSubmit() {
  if (submitting.value || lines.value.length === 0) return;
  submitting.value = true;
  emit("submit", tableCart, tableNote.value, tablePaid.value);
}

function updateBottomBarHeight() {
  if (bottomBarRef.value) {
    bottomBarHeight.value = bottomBarRef.value.offsetHeight;
  }
}

// 清空購物車（關閉抽屜或送出後）
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      Object.keys(tableCart).forEach((id) => delete tableCart[id]);
      tableNote.value = "";
      tablePaid.value = false;
      submitting.value = false;
    } else {
      // 抽屜打開時，等待 DOM 更新後測量底部區塊高度
      await nextTick();
      updateBottomBarHeight();
    }
  },
);
</script>

<template>
  <main>
    <!-- 遮罩層 -->
    <Transition name="fade">
      <div
        v-if="open"
        @click="$emit('close')"
        class="fixed inset-0 z-40 bg-black/30"
      ></div>
    </Transition>

    <!-- 抽屜 -->
    <Transition name="slide">
      <div
        v-if="open"
        class="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto bg-white shadow-2xl sm:w-[500px]"
      >
        <!-- 桌號標題（滾動時 fixed） -->
        <div
          class="sticky top-0 z-10 border-b-[2.5px] border-[#1a1a1a] bg-white px-5 py-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="brand-text text-2xl">
              {{ tableNum }} 桌{{ hasOrders ? "加點" : "點餐" }}
            </div>
            <button
              @click="$emit('close')"
              class="flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-white text-xl font-black hover:bg-[rgba(26,26,29,.05)]"
            >
              ×
            </button>
          </div>

          <!-- 目前訂單摘要 -->
          <div class="rounded-xl border-2 border-[#1a1a1a] bg-[#f2fbff] p-3">
            <div class="mb-2 text-xs font-extrabold">目前訂單</div>
            <div
              v-if="lines.length === 0"
              class="py-2 text-center text-xs text-[rgba(26,26,29,.5)]"
            >
              尚未加入品項
            </div>
            <div
              v-for="line in lines"
              :key="line.id"
              class="flex items-center justify-between border-b border-dashed border-[rgba(26,26,29,.15)] py-[12px] text-[15px] last:border-b-0"
            >
              <span
                >{{ line.zh }} × {{ line.qty
                }}<span class="text-[rgba(26,26,29,.5)]"
                  >{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span
                ></span
              >
              <div class="flex items-center gap-2.5">
                <span class="font-extrabold">${{ line.lineTotal }}</span>
                <button
                  @click="removeTableCartItem(line.id)"
                  class="flex size-7 cursor-pointer items-center justify-center rounded-md bg-[rgba(26,26,29,.1)] text-lg font-bold text-[#1a1a1a] hover:bg-[rgba(26,26,29,.2)]"
                >
                  ×
                </button>
              </div>
            </div>
            <div
              v-if="lines.length > 0"
              class="mt-2 flex justify-between border-t-2 border-dashed border-[rgba(26,26,29,.2)] pt-2 text-base font-black text-[#e8384f]"
            >
              <span>總計</span><span>${{ total }}</span>
            </div>
          </div>
        </div>

        <!-- 菜單內容 -->
        <div class="px-5 pt-4" :style="{ paddingBottom: menuPaddingBottom }">
          <MenuCatalog v-model="tableCart" />
        </div>

        <!-- 底部固定區：備註和送出按鈕 -->
        <div
          ref="bottomBarRef"
          class="fixed bottom-0 right-0 w-full border-t-[2.5px] border-[#1a1a1a] bg-white p-5 sm:w-[500px]"
        >
          <label class="mb-3 block text-xs font-extrabold">
            備註（選填）
            <input
              v-model="tableNote"
              type="text"
              placeholder="例如：不要洋蔥"
              class="mt-1.5 block w-full rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-[13px]"
            />
          </label>

          <PaymentStatusToggle v-model="tablePaid" class="mb-3" />

          <button
            v-debounce
            @click="handleSubmit"
            :disabled="lines.length === 0 || submitting"
            class="w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3.5 text-sm font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? "處理中…" : "送出訂單" }}
          </button>
        </div>
      </div>
    </Transition>
  </main>
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
