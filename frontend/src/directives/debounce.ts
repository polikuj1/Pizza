import type { Directive } from 'vue';

// 全局指令 v-debounce：在 capture 階段吞掉間隔內的重複 click，
// @click 的 handler 根本不會被呼叫。用法：v-debounce 或 v-debounce="1500"（毫秒）
// ponytail: 只針對 click，需要 input/scroll 之類再說
export const vDebounce: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const wait = binding.value ?? 1000;
    let last = 0;
    el.addEventListener(
      'click',
      (e) => {
        const now = Date.now();
        if (now - last < wait) {
          e.stopImmediatePropagation();
          e.preventDefault();
          return;
        }
        last = now;
      },
      true
    );
  },
};
