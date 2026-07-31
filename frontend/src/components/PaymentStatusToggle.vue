<script setup lang="ts">
const paid = defineModel<boolean>({ required: true });
</script>

<template>
  <div>
    <div class="mb-1.5 text-xs font-extrabold">付款狀態</div>
    <div class="flex gap-2">
      <button
        @click="paid = false"
        :class="!paid ? 'bg-[#e8384f] text-white border-[#e8384f]' : 'bg-white text-[#1a1a1a] border-[#1a1a1a]'"
        class="flex-1 cursor-pointer rounded-lg border-[2.5px] px-4 py-2 text-xs font-extrabold"
      >
        未付款
      </button>
      <button
        @click="paid = true"
        :class="paid ? 'bg-[#8fd99f] text-[#1a1a1a] border-[#1a1a1a]' : 'bg-white text-[#1a1a1a] border-[#1a1a1a]'"
        class="flex-1 cursor-pointer rounded-lg border-[2.5px] px-4 py-2 text-xs font-extrabold"
      >
        已付款
      </button>
    </div>
  </div>
</template>
